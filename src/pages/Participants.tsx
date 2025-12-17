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
import { Loader2, Plus, Trash2, Copy, Check, UserPlus, Mail, Upload, Download } from "lucide-react";
import { format } from "date-fns";
import { emailService } from "@/services/emailService";

const Participants = () => {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
    const [email, setEmail] = useState("");
    const [bulkEmails, setBulkEmails] = useState("");
    const [bulkResults, setBulkResults] = useState<{ email: string; password: string }[] | null>(null);
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

    // Bulk create mutation
    const bulkCreateMutation = useMutation({
        mutationFn: authService.createParticipantsBulk,
        onSuccess: (data) => {
            if (data && data.length > 0) {
                setBulkResults(data);
                toast.success(`${data.length} participants created successfully`);
                queryClient.invalidateQueries({ queryKey: ['participants'] });
            }
        },
        onError: () => {
            toast.error("Failed to create participants");
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

    const handleBulkCreate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!bulkEmails) return;

        // Split by comma or newline and filter empty
        const emails = bulkEmails
            .split(/[\n,]/)
            .map(e => e.trim())
            .filter(e => e && e.includes('@'));

        if (emails.length === 0) {
            toast.error("No valid emails found");
            return;
        }

        bulkCreateMutation.mutate(emails);
    };

    const handleSendEmail = async (participant: any) => {
        if (!participant.password) {
            toast.error("Password not available for this user");
            return;
        }

        try {
            await emailService.sendCredentialEmail(participant.email, participant.password);
            toast.success(`Credentials sent to ${participant.email}`);
        } catch (error) {
            toast.error("Failed to send email");
        }
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
        setIsBulkDialogOpen(false);
        setEmail("");
        setBulkEmails("");
        setGeneratedPassword(null);
        setBulkResults(null);
        setHasCopied(false);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const results = await authService.createParticipantsFromCSV(file);
            if (results && results.length > 0) {
                setBulkResults(results);
                setIsBulkDialogOpen(true); // Reuse the bulk dialog to show results
                toast.success(`${results.length} participants created successfully`);
                queryClient.invalidateQueries({ queryKey: ['participants'] });
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to upload/parse CSV");
        }

        // Reset input
        e.target.value = '';
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Participants</h1>
                        <p className="text-muted-foreground">Manage quiz participants and credentials</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => {
                            const csvContent = "Email\nparticipant1@example.com\nparticipant2@example.com";
                            const blob = new Blob([csvContent], { type: 'text/csv' });
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = 'participants_template.csv';
                            a.click();
                            window.URL.revokeObjectURL(url);
                        }}>
                            <Download className="mr-2 h-4 w-4" />
                            Template
                        </Button>

                        <div className="relative">
                            <input
                                type="file"
                                accept=".csv"
                                onChange={handleFileUpload}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <Button variant="outline">
                                <Upload className="mr-2 h-4 w-4" />
                                Upload CSV
                            </Button>
                        </div>

                        <Dialog open={isBulkDialogOpen} onOpenChange={(open) => !open && resetDialog()}>
                            <DialogTrigger asChild>
                                <Button variant="outline" onClick={() => setIsBulkDialogOpen(true)}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Bulk Add Text
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[500px]">
                                <DialogHeader>
                                    <DialogTitle>Bulk Add Participants</DialogTitle>
                                    <DialogDescription>
                                        Enter multiple email addresses separated by commas or newlines.
                                    </DialogDescription>
                                </DialogHeader>

                                {!bulkResults ? (
                                    <form onSubmit={handleBulkCreate} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="bulkEmails">Email Addresses</Label>
                                            <textarea
                                                id="bulkEmails"
                                                className="flex min-h-[150px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                placeholder="participant1@example.com&#10;participant2@example.com"
                                                value={bulkEmails}
                                                onChange={(e) => setBulkEmails(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <DialogFooter>
                                            <Button type="submit" disabled={bulkCreateMutation.isPending}>
                                                {bulkCreateMutation.isPending ? (
                                                    <>
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        Processing...
                                                    </>
                                                ) : (
                                                    "Add Participants"
                                                )}
                                            </Button>
                                        </DialogFooter>
                                    </form>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="max-h-[300px] overflow-y-auto space-y-2">
                                            {bulkResults.map((res, idx) => (
                                                <div key={idx} className="p-3 rounded-lg bg-secondary/50 flex justify-between items-center text-sm">
                                                    <div>
                                                        <div className="font-medium">{res.email}</div>
                                                        <div className="font-mono text-xs text-muted-foreground">{res.password}</div>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(`Email: ${res.email}\nPassword: ${res.password}`);
                                                            toast.success("Copied");
                                                        }}
                                                    >
                                                        <Copy className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                        <Button onClick={resetDialog} className="w-full">
                                            Done
                                        </Button>
                                    </div>
                                )}
                            </DialogContent>
                        </Dialog>

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
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleSendEmail(participant)}
                                                    title="Send Credentials via Email"
                                                >
                                                    <Mail className="h-4 w-4" />
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
