import { supabase } from "@/lib/supabase";

export interface User {
  id: string;
  email: string;
  role: "admin" | "participant" | "faculty";
  name?: string;
}

export const authService = {
  // Login
  async login(email: string, password: string): Promise<User | null> {
    const { data, error } = await supabase
      .from("users")
      .select("id, email, role, is_used")
      .eq("email", email)
      .eq("password", password)
      .single();

    if (error || !data) {
      return null;
    }

    // Check if credential is used (only for participants)
    if (data.role === "participant" && data.is_used) {
      console.error("Credential already used");
      return null;
    }

    // If participant, mark as used
    if (data.role === "participant") {
      const { error: updateError } = await supabase
        .from("users")
        .update({ is_used: true })
        .eq("id", data.id);

      if (updateError) {
        console.error("Failed to invalidate credential", updateError);
      }
    }

    let name = undefined;
    if (data.role === "participant") {
      const { data: pData } = await supabase
        .from("participants")
        .select("name")
        .eq("email", email)
        .single();
      if (pData) name = pData.name;
    } else if (data.role === "faculty") {
      // Try fetching by user_id first (more robust), fallback to email if needed or just use user_id
      const { data: fData } = await supabase
        .from("faculty")
        .select("name")
        .eq("user_id", data.id)
        .single();
      if (fData) name = fData.name;
    }

    return {
      id: data.id,
      email: data.email,
      role: data.role as "admin" | "participant" | "faculty",
      name: name,
    };
  },

  // Signup Faculty
  async signupFaculty(
    name: string,
    email: string,
    password: string,
  ): Promise<User | null> {
    // Check if user already exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (existingUser) {
      throw new Error("User already exists");
    }

    // Create user in users table
    const { data: newUser, error: userError } = await supabase
      .from("users")
      .insert([
        {
          email,
          password,
          role: "faculty",
          is_used: false,
        },
      ])
      .select()
      .single();

    if (userError || !newUser) {
      console.error("Error creating faculty user:", userError);
      throw userError;
    }

    // Create faculty profile
    const { error: profileError } = await supabase.from("faculty").insert([
      {
        user_id: newUser.id,
        email,
        name,
      },
    ]);

    if (profileError) {
      console.error("Error creating faculty profile:", profileError);
      // Cleanup user if profile creation fails? Ideally yes, but for now log it.
    }

    return {
      id: newUser.id,
      email: newUser.email,
      role: "faculty",
      name: name,
    };
  },

  // Update User Name (for participants if needed later, but removed from login)
  async updateName(email: string, name: string) {
    const { error } = await supabase
      .from("participants")
      .update({ name })
      .eq("email", email);

    if (error) console.error("Error updating name:", error);
  },

  // Create Participant (Admin only)
  async createParticipant(email: string): Promise<{ password: string } | null> {
    // Generate a random 8-character password
    const password = Math.random().toString(36).slice(-8);

    const { error } = await supabase.from("users").insert([
      {
        email,
        password,
        role: "participant",
        is_used: false,
      },
    ]);

    if (error) {
      console.error("Error creating participant:", error);
      return null;
    }

    // Also create a participant record for linking
    const { error: pError } = await supabase.from("participants").insert([
      {
        email,
        name: email.split("@")[0], // Default name from email
      },
    ]);

    if (pError) {
      console.log("Participant record creation note:", pError);
    }

    return { password };
  },

  // Create Multiple Participants
  async createParticipantsBulk(
    emails: string[],
  ): Promise<{ email: string; password: string }[]> {
    const results: { email: string; password: string }[] = [];

    for (const email of emails) {
      // Generate a random 8-character password
      const password = Math.random().toString(36).slice(-8);

      const { error } = await supabase.from("users").insert([
        {
          email,
          password,
          role: "participant",
          is_used: false,
        },
      ]);

      if (!error) {
        // Also create a participant record for linking
        await supabase.from("participants").insert([
          {
            email,
            name: email.split("@")[0], // Default name from email
          },
        ]);
        results.push({ email, password });
      } else {
        console.error(`Error creating participant ${email}:`, error);
      }
    }

    return results;
  },

  // Create Participants from CSV
  async createParticipantsFromCSV(
    file: File,
  ): Promise<{ email: string; password: string }[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const text = e.target?.result as string;
        if (!text) return reject("Empty file");

        const lines = text.split("\n");
        const emails: string[] = [];

        // Skip header if present (assume header if first line has 'email' or 'Email')
        const startIdx = lines[0].toLowerCase().includes("email") ? 1 : 0;

        for (let i = startIdx; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          // Assume first column is email
          const parts = line.split(",");
          const email = parts[0].trim();

          if (email && email.includes("@")) {
            emails.push(email);
          }
        }

        if (emails.length === 0) return reject("No valid emails found");

        try {
          const results = await this.createParticipantsBulk(emails);
          resolve(results);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject("Failed to read file");
      reader.readAsText(file);
    });
  },

  // Delete Participant Credential
  async deleteParticipant(email: string) {
    // First, delete from the 'participants' table
    const { error: pError } = await supabase
      .from("participants")
      .delete()
      .eq("email", email);

    if (pError) {
      console.warn(
        "Could not delete from participants table, it might not exist. Continuing deletion from users.",
        pError,
      );
    }

    // Then, delete from the 'users' table
    const { error: uError } = await supabase
      .from("users")
      .delete()
      .eq("email", email)
      .eq("role", "participant");

    if (uError) throw uError;
  },

  // Get All Participants (Users with role participant)
  async getParticipants() {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("role", "participant")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  },

  // Create Admin
  async createAdmin(email: string, password: string) {
    const { error } = await supabase.from("users").insert([
      {
        email,
        password,
        role: "admin",
        is_used: false, // Admins don't have one-time use
      },
    ]);

    if (error) throw error;
  },

  // Get All Admins
  async getAdmins() {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("role", "admin")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  },

  // Delete Admin
  async deleteAdmin(email: string) {
    const { error } = await supabase
      .from("users")
      .delete()
      .eq("email", email)
      .eq("role", "admin");

    if (error) throw error;
  },
};
