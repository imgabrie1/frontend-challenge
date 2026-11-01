import { createFileRoute, Link } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";
import { profileService } from "@/services/profile";
import { useSession } from "@/hooks/useSession";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toaster";
import { Camera, Lock, User, AtSign, AlertCircle } from "lucide-react";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, and underscores allowed"),
  bio: z.string().optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(8, "New password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain an uppercase letter")
    .regex(/[0-9]/, "Must contain a number"),
});

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const {
    user,
    isAuthenticated,
    isLoading: authLoading,
    updateUser,
  } = useSession();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    values: {
      name: user?.name ?? "",
      username: user?.username ?? "",
      bio: user?.bio ?? "",
    },
  });

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data: ProfileForm) =>
      profileService.update({
        name: data.name,
        username: data.username,
        bio: data.bio || null,
        avatarUrl: user?.avatarUrl ?? null,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["profile"] });
      void queryClient.invalidateQueries({ queryKey: ["auth"] });
      toast({
        title: "Profile updated!",
        description: "Your collector details have been saved.",
      });
    },
    onError: (error: any) => {
      const details = error?.response?.data?.details;
      if (details) {
        Object.entries(details).forEach(([field, msgs]) => {
          profileForm.setError(field as keyof ProfileForm, {
            message: Array.isArray(msgs) ? msgs[0] : String(msgs),
          });
        });
      } else {
        toast({
          variant: "destructive",
          title: "Update failed",
          description:
            error?.response?.data?.message || "Could not update profile.",
        });
      }
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: (data: PasswordForm) => profileService.changePassword(data),
    onSuccess: () => {
      passwordForm.reset();
      toast({
        title: "Password changed!",
        description: "Your password has been successfully updated.",
      });
    },
    onError: (error: any) => {
      const details = error?.response?.data?.details;
      if (details?.currentPassword) {
        passwordForm.setError("currentPassword", {
          message: details.currentPassword[0],
        });
      } else {
        toast({
          variant: "destructive",
          title: "Password change failed",
          description:
            error?.response?.data?.message || "Current password incorrect.",
        });
      }
    },
  });

  const avatarMutation = useMutation({
    mutationFn: (file: File) => profileService.uploadAvatar(file),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["profile"] });
      void queryClient.invalidateQueries({ queryKey: ["auth"] });
      toast({
        title: "Avatar updated!",
        description: "Your new avatar is live.",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: "Could not upload avatar image.",
      });
    },
  });

  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-xl">
        <Skeleton className="h-8 w-36 mb-6" />
        <Skeleton className="h-64 w-full rounded-2xl mb-6" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-20 text-center max-w-md">
        <AlertCircle
          className="h-12 w-12 text-primary mx-auto mb-4"
          aria-hidden="true"
        />
        <h1 className="text-2xl font-bold mb-2">Sign in required</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Please sign in to view and edit your collector profile.
        </p>
        <Button asChild className="w-full">
          <Link to="/login" search={{ redirect: "/profile" }}>
            Sign In
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10 max-w-xl space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">
          Collector Profile
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your personal details, public presence, and account security
        </p>
      </div>

      <div className="p-6 rounded-2xl border border-border bg-card shadow-sm flex items-center gap-6">
        <div className="relative group">
          <img
            src={
              user?.avatarUrl ??
              `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}`
            }
            alt={`Avatar of ${user?.name}`}
            className="w-24 h-24 rounded-full object-cover border-2 border-primary ring-4 ring-primary/10"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="absolute inset-0 bg-background/60 backdrop-blur-xs rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            aria-label="Upload new avatar"
          >
            <Camera className="h-6 w-6 text-foreground" aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-2">
          <p className="font-semibold text-base">{user?.name}</p>
          <p className="text-xs text-muted-foreground">@{user?.username}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={avatarMutation.isPending}
            className="text-xs"
          >
            {avatarMutation.isPending ? "Uploading..." : "Change Avatar"}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            aria-label="Upload avatar image file"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file && user?.username) {
                const localPreviewUrl = URL.createObjectURL(file);
                localStorage.setItem(
                  `avatar_${user.username}`,
                  localPreviewUrl,
                );
                updateUser({ avatarUrl: localPreviewUrl });
                avatarMutation.mutate(file);
              }
            }}
          />
        </div>
      </div>

      <section className="p-6 rounded-2xl border border-border bg-card shadow-sm">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <User className="h-5 w-5 text-primary" aria-hidden="true" />
          <span>Personal Information</span>
        </h2>

        <form
          onSubmit={profileForm.handleSubmit((data) =>
            updateProfileMutation.mutate(data),
          )}
          className="space-y-4"
          noValidate
          aria-label="Profile information form"
        >
          <div className="space-y-1.5">
            <Label htmlFor="profile-name">Full Name</Label>
            <Input
              id="profile-name"
              aria-invalid={!!profileForm.formState.errors.name}
              aria-describedby={
                profileForm.formState.errors.name ? "name-err" : undefined
              }
              {...profileForm.register("name")}
            />
            {profileForm.formState.errors.name && (
              <p
                id="name-err"
                role="alert"
                className="text-xs text-destructive font-medium"
              >
                {profileForm.formState.errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="profile-username">Username</Label>
            <div className="relative">
              <AtSign
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                id="profile-username"
                className="pl-9"
                aria-invalid={!!profileForm.formState.errors.username}
                aria-describedby={
                  profileForm.formState.errors.username ? "user-err" : undefined
                }
                {...profileForm.register("username")}
              />
            </div>
            {profileForm.formState.errors.username && (
              <p
                id="user-err"
                role="alert"
                className="text-xs text-destructive font-medium"
              >
                {profileForm.formState.errors.username.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="profile-bio">Bio</Label>
            <textarea
              id="profile-bio"
              rows={3}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Tell other collectors about yourself..."
              {...profileForm.register("bio")}
            />
          </div>

          <Button
            type="submit"
            className="w-full font-semibold"
            disabled={updateProfileMutation.isPending}
            aria-busy={updateProfileMutation.isPending}
          >
            {updateProfileMutation.isPending
              ? "Saving Changes..."
              : "Save Profile Details"}
          </Button>
        </form>
      </section>

      <section className="p-6 rounded-2xl border border-border bg-card shadow-sm">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Lock className="h-5 w-5 text-primary" aria-hidden="true" />
          <span>Security & Password</span>
        </h2>

        <form
          onSubmit={passwordForm.handleSubmit((data) =>
            changePasswordMutation.mutate(data),
          )}
          className="space-y-4"
          noValidate
          aria-label="Change password form"
        >
          <div className="space-y-1.5">
            <Label htmlFor="current-pass">Current Password</Label>
            <Input
              id="current-pass"
              type="password"
              autoComplete="current-password"
              aria-invalid={!!passwordForm.formState.errors.currentPassword}
              aria-describedby={
                passwordForm.formState.errors.currentPassword
                  ? "curr-pass-err"
                  : undefined
              }
              {...passwordForm.register("currentPassword")}
            />
            {passwordForm.formState.errors.currentPassword && (
              <p
                id="curr-pass-err"
                role="alert"
                className="text-xs text-destructive font-medium"
              >
                {passwordForm.formState.errors.currentPassword.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="new-pass">New Password</Label>
            <Input
              id="new-pass"
              type="password"
              placeholder="Min 8 chars, 1 uppercase & 1 number"
              autoComplete="new-password"
              aria-invalid={!!passwordForm.formState.errors.newPassword}
              aria-describedby={
                passwordForm.formState.errors.newPassword
                  ? "new-pass-err"
                  : undefined
              }
              {...passwordForm.register("newPassword")}
            />
            {passwordForm.formState.errors.newPassword && (
              <p
                id="new-pass-err"
                role="alert"
                className="text-xs text-destructive font-medium"
              >
                {passwordForm.formState.errors.newPassword.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            variant="secondary"
            className="w-full font-semibold"
            disabled={changePasswordMutation.isPending}
            aria-busy={changePasswordMutation.isPending}
          >
            {changePasswordMutation.isPending
              ? "Updating Password..."
              : "Update Password"}
          </Button>
        </form>
      </section>
    </div>
  );
}
