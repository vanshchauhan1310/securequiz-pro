import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authService } from "@/services/authService";
import { Loader2, Plus, Trash2, Shield, UserCog } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/context/AuthContext";

const Settings = () => {
    const { user } = useAuth();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const queryClient = useQueryClient();

    // Fetch admins
    const { data: admins, isLoading } = useQuery({
        queryKey: ['admins'],
        queryFn: authService.getAdmins,
    });

    // Create admin mutation
    const createMutation = useMutation({
        mutationFn: async () => {
            await authService.createAdmin(email, password);
        },
        onSuccess: () => {
            toast.success("Admin created successfully");
            queryClient.invalidateQueries({ queryKey: ['admins'] });
            resetDialog();
        },
        onError: (error: any) => {
            console.error(error);
            toast.error("Failed to create admin. Email might be taken.");
        },
    });

    // Delete admin mutation
    const deleteMutation = useMutation({
        mutationFn: authService.deleteAdmin,
        onSuccess: () => {
            toast.success("Admin removed successfully");
            queryClient.invalidateQueries({ queryKey: ['admins'] });
        },
        onError: () => {
            toast.error("Failed to remove admin");
        },
    });

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) return;
        createMutation.mutate();
    };

    const handleDelete = (adminEmail: string) => {
        if (adminEmail === user?.email) {
            toast.error("You cannot delete your own account");
            return;
        }
        if (confirm(`Are you sure you want to remove admin rights for ${adminEmail}?`)) {
            deleteMutation.mutate(adminEmail);
        }
    };

    const resetDialog = () => {
        setIsDialogOpen(false);
        setEmail("");
        setPassword("");
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Settings</h1>
                        <p className="text-muted-foreground">Manage application settings and administrators</p>
                    </div>
                </div>

                <div className="grid gap-6">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <Shield className="h-5 w-5 text-primary" />
                                        Admin Management
                                    </CardTitle>
                                    <CardDescription>
                                        Manage faculty members who have admin access to the platform.
                                    </CardDescription>
                                </div>
                                <Dialog open={isDialogOpen} onOpenChange={(open) => !open && resetDialog()}>
                                    <DialogTrigger asChild>
                                        <Button onClick={() => setIsDialogOpen(true)}>
                                            <UserCog className="mr-2 h-4 w-4" />
                                            Add Admin
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Add New Admin</DialogTitle>
                                            <DialogDescription>
                                                Create a new admin account for a faculty member.
                                            </DialogDescription>
                                        </DialogHeader>

                                        <form onSubmit={handleCreate} className="space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="email">Email Address</Label>
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    placeholder="faculty@college.edu"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="password">Password</Label>
                                                <Input
                                                    id="password"
                                                    type="password"
                                                    placeholder="••••••••"
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    required
                                                    minLength={6}
                                                />
                                            </div>
                                            <DialogFooter>
                                                <Button type="submit" disabled={createMutation.isPending}>
                                                    {createMutation.isPending ? (
                                                        <>
                                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                            Creating...
                                                        </>
                                                    ) : (
                                                        "Create Admin"
                                                    )}
                                                </Button>
                                            </DialogFooter>
                                        </form>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                </div>
                            ) : admins && admins.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Role</TableHead>
                                            <TableHead>Created At</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {admins.map((admin: any) => (
                                            <TableRow key={admin.id}>
                                                <TableCell className="font-medium">
                                                    {admin.email}
                                                    {admin.email === user?.email && (
                                                        <span className="ml-2 text-xs text-muted-foreground">(You)</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                                                        Admin
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    {format(new Date(admin.created_at), "MMM d, yyyy")}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleDelete(admin.email)}
                                                        disabled={admin.email === user?.email}
                                                        className="text-destructive hover:text-destructive/90 disabled:opacity-50"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    No admins found.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default Settings;
