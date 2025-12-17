import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export const emailService = {
  async sendEmail(to: string, subject: string, html: string) {
    try {
      const { data, error } = await supabase.functions.invoke("send-email", {
        body: { to, subject, html },
      });

      if (error) {
        console.error("Error invoking function:", error);
        throw error;
      }

      // Check if the function returned an error response
      if (data && data.error) {
        throw new Error(data.error);
      }

      return data;
    } catch (error) {
      console.error("Error sending email:", error);
      toast.error(
        "Failed to send email. Ensure the 'send-email' function is deployed.",
      );
      throw error;
    }
  },

  async sendResultsEmail(
    to: string,
    userName: string,
    quizTitle: string,
    score: number,
    totalQuestions: number,
  ) {
    const subject = `Your Quiz Results for "${quizTitle}"`;
    const isPass = score >= 70; // Assuming 70% is the passing score

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #4f46e5; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">Quiz Results</h1>
        </div>
        <div style="padding: 30px;">
          <p>Hello ${userName},</p>
          <p>Thank you for completing the quiz. Here are your results for <strong>"${quizTitle}"</strong>:</p>

          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 30px; border-radius: 8px; margin: 30px 0; text-align: center;">
            <div style="font-size: 16px; color: #64748b; margin-bottom: 15px;">Your Score</div>
            <div style="font-size: 56px; font-weight: bold; color: ${isPass ? "#10b981" : "#ef4444"}; margin-bottom: 10px;">
              ${score}%
            </div>
            <div style="font-size: 16px; color: #64748b;">
              Based on ${totalQuestions} questions
            </div>
          </div>

          <div style="text-align: center; margin-bottom: 30px;">
            ${
              isPass
                ? '<p style="color: #10b981; font-weight: bold;">Congratulations, you have passed the quiz!</p>'
                : '<p style="color: #ef4444; font-weight: bold;">We encourage you to review the material and try again if possible.</p>'
            }
          </div>

          <p style="margin-top: 30px;">If you have any questions about your results, please contact the quiz administrator.</p>

          <p style="margin-top: 20px;">Best regards,<br><strong>The Quizify Team</strong></p>
        </div>
        <div style="background-color: #f1f5f9; text-align: center; padding: 15px; font-size: 12px; color: #64748b;">
          <p>This is an automated message. Please do not reply to this email.</p>
        </div>
      </div>
    `;
    return this.sendEmail(to, subject, html);
  },

  async sendCredentialEmail(to: string, password: string) {
    const subject = "Your Secure Quiz Credentials";
    const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
                <div style="background-color: #4f46e5; color: white; padding: 20px; text-align: center;">
                    <h1 style="margin: 0;">Welcome to Quizify</h1>
                </div>
                <div style="padding: 30px;">
                    <p>Hello,</p>
                    <p>You have been registered for a secure quiz. Please use the credentials below to log in and start your assessment.</p>

                    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px; margin: 30px 0; text-align: center;">
                        <p style="margin: 0 0 10px 0;"><strong>Email:</strong> ${to}</p>
                        <p style="margin: 0; font-size: 1.2em;"><strong>One-Time Password:</strong> <strong style="color: #4f46e5; letter-spacing: 2px;">${password}</strong></p>
                    </div>

                    <div style="text-align: center; margin-bottom: 30px;">
                        <a href="https://quizify.edcatalyst.in/login" style="background-color: #4f46e5; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Login to Start Quiz</a>
                    </div>

                    <hr style="border: 0; border-top: 1px solid #e0e0e0; margin: 30px 0;">

                    <h3 style="color: #333;">Important Instructions:</h3>
                    <h4>Do's:</h4>
                    <ul style="padding-left: 20px; color: #555;">
                        <li>Ensure you have a stable internet connection.</li>
                        <li>Use a modern web browser like Chrome, Firefox, or Safari.</li>
                        <li>Complete the quiz in a single session.</li>
                        <li>Read each question carefully before answering.</li>
                    </ul>

                    <h4>Don'ts:</h4>
                    <ul style="padding-left: 20px; color: #555;">
                        <li>Do not refresh the page during the quiz.</li>
                        <li>Do not switch tabs or open other applications. Your session is monitored for security purposes.</li>
                        <li>Do not use the browser's back or forward buttons.</li>
                        <li>Do not share your credentials with anyone.</li>
                    </ul>

                    <p style="margin-top: 30px;">If you face any technical issues, please contact the quiz administrator.</p>

                    <p style="margin-top: 20px;">Best regards,<br><strong>The Quizify Team</strong></p>
                </div>
                <div style="background-color: #f1f5f9; text-align: center; padding: 15px; font-size: 12px; color: #64748b;">
                    <p>This is an automated message. Please do not reply to this email.</p>
                </div>
            </div>
        `;
    return this.sendEmail(to, subject, html);
  },
};
