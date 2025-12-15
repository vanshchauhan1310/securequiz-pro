import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Loader2, Plus, Trash2, Copy, Check, UserPlus } from "lucide-react";
import { format } from "date-fns";

const Participants = () => {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [email, setEmail] = useState("");
    const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
    const [hasCopied, setHasCopied] = useState(false);
    const queryClient = useQueryClient();

    // Fetch participants
    const { data: participants, isLoading } = useQuery({
        queryKey: ['participants'],
        queryFn: authService.getParticipants,
    });

    // Create participant mutation
    const createMutation = useMutation({
        mutationFn: authService.createParticipant,
        onSuccess: (data) => {
            if (data) {
                setGeneratedPassword(data.password);
                toast.success("Participant created successfully");
                queryClient.invalidateQueries({ queryKey: ['participants'] });
            }
        },
        onError: () => {
            toast.error("Failed to create participant");
        },
    });

    // Delete participant mutation
    const deleteMutation = useMutation({
        mutationFn: authService.deleteParticipant,
        onSuccess: () => {
            toast.success("Participant deleted successfully");
            queryClient.invalidateQueries({ queryKey: ['participants'] });
        },
        onError: () => {
            toast.error("Failed to delete participant");
        },
    });

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;
        createMutation.mutate(email);
    };

    const handleDelete = (email: string) => {
        if (confirm(`Are you sure you want to delete participant ${email}?`)) {
            deleteMutation.mutate(email);
        }
    };

    const copyToClipboard = () => {
        if (generatedPassword) {
            navigator.clipboard.writeText(
                `Email: ${email}\nPassword: ${generatedPassword}`
            );
            setHasCopied(true);
            toast.success("Credentials copied to clipboard");
            setTimeout(() => setHasCopied(false), 2000);
        }
    };

    const resetDialog = () => {
        setIsDialogOpen(false);
        setEmail("");
        setGeneratedPassword(null);
        setHasCopied(false);
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Participants</h1>
                        <p className="text-muted-foreground">Manage quiz participants and credentials</p>
                    </div>
                    <Dialog open={isDialogOpen} onOpenChange={(open) => !open && resetDialog()}>
                        <DialogTrigger asChild>
                            <Button onClick={() => setIsDialogOpen(true)}>
                                <UserPlus className="mr-2 h-4 w-4" />
                                Add Participant
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add New Participant</DialogTitle>
                                <DialogDescription>
                                    Generate a one-time login credential for a participant.
                                </DialogDescription>
                            </DialogHeader>

                            {!generatedPassword ? (
                                <form onSubmit={handleCreate} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email Address</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="participant@example.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <DialogFooter>
                                        <Button type="submit" disabled={createMutation.isPending}>
                                            {createMutation.isPending ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Generating...
                                                </>
                                            ) : (
                                                "Generate Credentials"
                                            )}
                                        </Button>
                                    </DialogFooter>
                                </form>
                            ) : (
                                <div className="space-y-4">
                                    <div className="p-4 rounded-lg bg-secondary/50 space-y-3">
                                        <div className="space-y-1">
                                            <Label className="text-xs text-muted-foreground">Email</Label>
                                            <div className="font-medium">{email}</div>
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs text-muted-foreground">One-Time Password</Label>
                                            <div className="font-mono text-lg font-bold tracking-wider text-primary">
                                                {generatedPassword}
                                            </div>
                                        </div>
                                    </div>
                                    <Button onClick={copyToClipboard} className="w-full" variant="secondary">
                                        {hasCopied ? (
                                            <>
                                                <Check className="mr-2 h-4 w-4" />
                                                Copied!
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="mr-2 h-4 w-4" />
                                                Copy Credentials
                                            </>
                                        )}
                                    </Button>
                                    <Button onClick={resetDialog} className="w-full">
                                        Done
                                    </Button>
                                </div>
                            )}
                        </DialogContent>
                    </Dialog>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Registered Participants</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : participants && participants.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Created At</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {participants.map((participant: any) => (
                                        <TableRow key={participant.id}>
                                            <TableCell className="font-medium">{participant.email}</TableCell>
                                            <TableCell>
                                                {format(new Date(participant.created_at), "MMM d, yyyy HH:mm")}
                                            </TableCell>
                                            <TableCell>
                                                {participant.is_used ? (
                                                    <span className="text-muted-foreground text-xs bg-secondary px-2 py-1 rounded">Used</span>
                                                ) : (
                                                    <span className="text-green-600 text-xs bg-green-100 px-2 py-1 rounded">Active</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(participant.email)}
                                                    className="text-destructive hover:text-destructive/90"
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
                                No participants found. Add one to get started.
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default Participants;
