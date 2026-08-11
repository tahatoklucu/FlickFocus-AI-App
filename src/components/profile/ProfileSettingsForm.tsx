"use client";

import {
  FormEvent,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import { useAuth } from "@/context/AuthContext";
import Button from "@/components/ui/Button";
import UserAvatar from "@/components/profile/UserAvatar";
import {
  AVATAR_ACCEPT,
  DISPLAY_NAME_MAX_LENGTH,
  getProfileUpdateErrorMessage,
  normalizeDisplayName,
  validateDisplayName,
} from "@/lib/profile/profile-utils";
import { cn } from "@/lib/cn";
import { isValidPhotoURL } from "@/lib/profile/avatar-utils";

interface ProfileSettingsFormProps {
  displayName: string;
  photoURL: string | null;
  cloudSyncOffline?: boolean;
  profileSyncing?: boolean;
  onRetryCloudSync?: () => void;
}

export default function ProfileSettingsForm({
  displayName,
  photoURL,
  cloudSyncOffline = false,
  profileSyncing = false,
  onRetryCloudSync,
}: ProfileSettingsFormProps) {
  const { updateUserProfile, uploadProfilePhoto } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [nameInput, setNameInput] = useState(displayName);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(photoURL);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savePhase, setSavePhase] = useState<"uploading" | "saving" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const normalizedInput = useMemo(
    () => normalizeDisplayName(nameInput),
    [nameInput],
  );

  const hasNameChange = normalizedInput !== normalizeDisplayName(displayName);
  const hasPhotoChange = selectedFile !== null || removePhoto;
  const hasChanges = hasNameChange || hasPhotoChange;

  function handleNameChange(event: ChangeEvent<HTMLInputElement>) {
    setNameInput(event.target.value);
    setError(null);
    setSuccess(null);
  }

  function handlePhotoSelect(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    setSelectedFile(file);
    setRemovePhoto(false);
    setError(null);
    setSuccess(null);
    setAvatarPreview(URL.createObjectURL(file));
  }

  function handleRemovePhoto() {
    setSelectedFile(null);
    setRemovePhoto(true);
    setAvatarPreview(null);
    setError(null);
    setSuccess(null);
  }

  function handleResetPhoto() {
    setSelectedFile(null);
    setRemovePhoto(false);
    setAvatarPreview(photoURL);
    setError(null);
    setSuccess(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const nameValidationError = validateDisplayName(nameInput);
    if (nameValidationError) {
      setError(nameValidationError);
      return;
    }

    if (!hasChanges) {
      setError("No changes to save.");
      return;
    }

    setIsSaving(true);
    setSavePhase(null);

    try {
      let nextPhotoURL: string | null | undefined;

      if (selectedFile) {
        setSavePhase("uploading");
        nextPhotoURL = await uploadProfilePhoto(selectedFile);
      } else if (removePhoto) {
        nextPhotoURL = null;
      }

      setSavePhase("saving");
      await updateUserProfile({
        displayName: normalizedInput,
        ...(nextPhotoURL !== undefined ? { photoURL: nextPhotoURL } : {}),
      });

      setSelectedFile(null);
      setRemovePhoto(false);
      setSuccess("Profile updated successfully.");
    } catch (submitError) {
      setError(getProfileUpdateErrorMessage(submitError));
    } finally {
      setIsSaving(false);
      setSavePhase(null);
    }
  }

  const previewPhotoURL =
    removePhoto || !avatarPreview || !isValidPhotoURL(avatarPreview)
      ? null
      : avatarPreview;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {cloudSyncOffline ? (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-800 dark:text-amber-100">
          <p>
            Cloud sync is offline. Your changes are saved on this device.
          </p>
          {onRetryCloudSync ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onRetryCloudSync}
              disabled={profileSyncing || isSaving}
              className="mt-2 px-0 text-amber-700 hover:text-amber-900 dark:text-amber-200 dark:hover:text-white"
            >
              {profileSyncing ? "Reconnecting..." : "Try cloud sync again"}
            </Button>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <div className="relative shrink-0">
          <UserAvatar
            displayName={normalizedInput || displayName}
            photoURL={previewPhotoURL}
            size="xl"
          />
        </div>

        <div className="flex flex-1 flex-col items-center gap-2 sm:items-start">
          <input
            ref={fileInputRef}
            type="file"
            accept={AVATAR_ACCEPT}
            onChange={handlePhotoSelect}
            className="sr-only"
            aria-label="Upload profile photo"
          />
          <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isSaving}
            >
              Change photo
            </Button>
            {(isValidPhotoURL(photoURL) || isValidPhotoURL(avatarPreview)) &&
            !removePhoto ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemovePhoto}
                disabled={isSaving}
              >
                Remove photo
              </Button>
            ) : null}
            {hasPhotoChange ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleResetPhoto}
                disabled={isSaving}
              >
                Reset photo
              </Button>
            ) : null}
          </div>
          <p className="text-center text-xs text-zinc-500 dark:text-zinc-400 sm:text-left">
            JPG, PNG, WebP or GIF. Max 2 MB. Saved to your profile in Firestore.
          </p>
        </div>
      </div>

      <div>
        <label
          htmlFor="profile-display-name"
          className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400"
        >
          Display name
        </label>
        <input
          id="profile-display-name"
          type="text"
          value={nameInput}
          onChange={handleNameChange}
          disabled={isSaving}
          maxLength={DISPLAY_NAME_MAX_LENGTH}
          autoComplete="nickname"
          className="auth-field !pl-4"
          placeholder="Your name"
        />
        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
          This name appears in the header and across your account.
        </p>
      </div>

      {error ? (
        <div
          role="alert"
          className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-200"
        >
          {error}
        </div>
      ) : null}

      {success ? (
        <div
          role="status"
          className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-200"
        >
          {success}
        </div>
      ) : null}

      <Button
        type="submit"
        variant="violet"
        disabled={isSaving || !hasChanges}
        className={cn("w-full sm:w-auto", !hasChanges && "opacity-70")}
      >
        {isSaving
          ? savePhase === "uploading"
            ? "Uploading photo..."
            : "Saving changes..."
          : "Save profile"}
      </Button>
    </form>
  );
}
