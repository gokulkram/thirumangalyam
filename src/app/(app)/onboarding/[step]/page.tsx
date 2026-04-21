"use client";

import { use, useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Input, RadioGroup, Select } from "@/components/ui";
import { Textarea } from "@/components/ui";
import { StepIndicator } from "@/components/layout";
import { PhotoUploadZone } from "@/components/domain";
import { MOTHER_TONGUES, COMMUNITIES as STATIC_COMMUNITIES, SUB_COMMUNITIES as STATIC_SUB_COMMUNITIES, NAKSHATRAS, EDUCATION_LEVELS, OCCUPATIONS, INCOME_RANGES, HOBBIES, HEIGHT_OPTIONS, WIZARD_STEPS } from "@/lib/constants";
import { Shield, Loader2 } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

interface ProfileData {
  fullName: string;
  dateOfBirth: string;
  height: string;
  motherTongue: string;
  community: string;
  subCaste: string;
  maritalStatus: string;
  religion: string;
  gothra: string;
  star: string;
  rashi: string;
  hasDosham: string;
  familyType: string;
  familyStatus: string;
  fatherOccupation: string;
  motherOccupation: string;
  highestDegree: string;
  institution: string;
  occupation: string;
  employer: string;
  annualIncome: string;
  workLocation: string;
  whatsappNumber: string;
  diet: string;
  smoking: string;
  drinking: string;
  hobbies: string[];
  aboutMe: string;
  lookingFor: string;
  // Partner preferences (step 6)
  pp_ageMin: string;
  pp_ageMax: string;
  pp_heightMin: string;
  pp_heightMax: string;
  pp_education: string;
  pp_occupation: string;
  pp_community: string;
  pp_location: string;
  pp_starCompatibility: string;
  pp_dosham: string;
  pp_diet: string;
  [key: string]: any;
}

const defaultProfile: ProfileData = {
  fullName: "",
  dateOfBirth: "",
  height: "",
  motherTongue: "",
  community: "",
  subCaste: "",
  maritalStatus: "never_married",
  religion: "Hindu",
  gothra: "",
  star: "",
  rashi: "",
  hasDosham: "",
  familyType: "nuclear",
  familyStatus: "",
  fatherOccupation: "",
  motherOccupation: "",
  highestDegree: "",
  institution: "",
  occupation: "",
  employer: "",
  annualIncome: "",
  workLocation: "",
  whatsappNumber: "",
  diet: "vegetarian",
  smoking: "no",
  drinking: "no",
  hobbies: [],
  aboutMe: "",
  lookingFor: "",
  pp_ageMin: "22",
  pp_ageMax: "32",
  pp_heightMin: "",
  pp_heightMax: "",
  pp_education: "",
  pp_occupation: "",
  pp_community: "",
  pp_location: "",
  pp_starCompatibility: "preferred",
  pp_dosham: "doesnt_matter",
  pp_diet: "doesnt_matter",
};

export default function OnboardingStepPage({
  params,
}: {
  params: Promise<{ step: string }>;
}) {
  const { step: stepParam } = use(params);
  const step = parseInt(stepParam, 10);
  const stepConfig = WIZARD_STEPS.find((s) => s.step === step);
  const isFirst = step === 1;
  const isLast = step === 6;
  const router = useRouter();
  const { t } = useTranslation();

  const [profile, setProfile] = useState<ProfileData>(defaultProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dbCommunities, setDbCommunities] = useState<string[]>([]);
  const [dbSubCommunities, setDbSubCommunities] = useState<Record<string, string[]>>({});

  // Fetch communities from DB
  useEffect(() => {
    fetch("/api/communities")
      .then((res) => res.json())
      .then((data) => {
        setDbCommunities(data.communities || []);
        setDbSubCommunities(data.subCommunities || {});
      })
      .catch(() => {});
  }, []);

  // Fetch existing profile data
  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/profiles/me");
        if (res.ok) {
          const data = await res.json();
          if (data.profile) {
            const profileEntries = Object.fromEntries(
              Object.entries(data.profile).filter(([_, v]) => v !== null && v !== undefined && v !== "")
            );
            // Map partner preferences to pp_ prefixed fields
            const pp = data.partnerPreferences || {};
            const ppEntries: Record<string, any> = {};
            if (pp.ageRange?.[0]) ppEntries.pp_ageMin = String(pp.ageRange[0]);
            if (pp.ageRange?.[1]) ppEntries.pp_ageMax = String(pp.ageRange[1]);
            if (pp.heightRange?.[0]) ppEntries.pp_heightMin = pp.heightRange[0];
            if (pp.heightRange?.[1]) ppEntries.pp_heightMax = pp.heightRange[1];
            if (pp.education?.[0]) ppEntries.pp_education = pp.education[0];
            if (pp.occupation?.[0]) ppEntries.pp_occupation = pp.occupation[0];
            if (pp.communities?.[0]) ppEntries.pp_community = pp.communities[0];
            if (pp.locations?.[0]) ppEntries.pp_location = pp.locations[0];
            if (pp.starCompatibility) ppEntries.pp_starCompatibility = pp.starCompatibility;
            if (pp.dosham) ppEntries.pp_dosham = pp.dosham;
            if (pp.diet) ppEntries.pp_diet = pp.diet;

            setProfile((prev) => ({
              ...prev,
              ...profileEntries,
              ...ppEntries,
            }));
          }
        }
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  const updateField = useCallback((field: string, value: any) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSave = useCallback(async (navigateTo?: string) => {
    setSaving(true);
    try {
      // Separate partner preferences from profile data
      const { pp_ageMin, pp_ageMax, pp_heightMin, pp_heightMax, pp_education, pp_occupation, pp_community, pp_location, pp_starCompatibility, pp_dosham, pp_diet, ...profileOnly } = profile;

      const payload: any = { ...profileOnly };

      // Include partner preferences if on step 6
      if (step === 6) {
        payload.partnerPreferences = {
          ageRange: [parseInt(pp_ageMin) || 22, parseInt(pp_ageMax) || 32],
          heightRange: [pp_heightMin || "5'0\"", pp_heightMax || "6'0\""],
          education: pp_education ? [pp_education] : [],
          occupation: pp_occupation ? [pp_occupation] : [],
          communities: pp_community && pp_community !== "any" ? [pp_community] : [],
          locations: pp_location ? [pp_location] : [],
          starCompatibility: pp_starCompatibility || "preferred",
          dosham: pp_dosham || "doesnt_matter",
          diet: pp_diet || "doesnt_matter",
        };
      }

      const res = await fetch("/api/profiles/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok && navigateTo) {
        router.push(navigateTo);
      }
    } catch (err) {
      console.error("Failed to save profile:", err);
    } finally {
      setSaving(false);
    }
  }, [profile, router, step]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-6 md:px-8 lg:px-20">
      {/* Step indicator */}
      <div className="mb-8">
        <StepIndicator currentStep={step} />
      </div>

      {/* Step content */}
      <div className="mx-auto max-w-[640px]">
        <h1 className="text-2xl font-bold text-neutral-900">
          {stepConfig?.description || "Complete Your Profile"}
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          {step <= 3
            ? "This information helps us find the right matches for you."
            : "This is optional but greatly improves your match quality."}
        </p>

        <div className="mt-8 space-y-5">
          {step === 1 && <Step1Fields profile={profile} updateField={updateField} communityList={dbCommunities} subCommunityMap={dbSubCommunities} />}
          {step === 2 && <Step2Fields profile={profile} updateField={updateField} />}
          {step === 3 && <Step3Fields profile={profile} updateField={updateField} />}
          {step === 4 && <Step4Fields profile={profile} updateField={updateField} />}
          {step === 5 && <Step5Fields />}
          {step === 6 && <Step6Fields profile={profile} updateField={updateField} />}
        </div>

        {/* Bottom action bar */}
        <div className="mt-10 flex items-center justify-between border-t border-neutral-200 pt-6">
          <div>
            {!isFirst && (
              <Button variant="text" asChild>
                <Link href={`/onboarding/${step - 1}`}>&larr; Back</Link>
              </Button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              disabled={saving}
              onClick={() => handleSave()}
            >
              {saving ? t.shared.saving : t.shared.saveDraft}
            </Button>
            <Button
              variant="primary"
              size="md"
              disabled={saving}
              onClick={() => handleSave(isLast ? "/dashboard" : `/onboarding/${step + 1}`)}
            >
              {saving ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t.shared.saving}
                </span>
              ) : isLast ? (
                t.shared.completeProfile
              ) : (
                `${t.shared.saveAndContinue} \u2192`
              )}
            </Button>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-neutral-400 flex items-center justify-center gap-1">
          <Shield className="h-3.5 w-3.5" />
          Your information is private and secure
        </p>
      </div>
    </div>
  );
}

interface StepFieldsProps {
  profile: ProfileData;
  updateField: (field: string, value: any) => void;
  communityList?: string[];
  subCommunityMap?: Record<string, string[]>;
}

function Step1Fields({ profile, updateField, communityList = [], subCommunityMap = {} }: StepFieldsProps) {
  const communities = communityList.length > 0 ? communityList : [...STATIC_COMMUNITIES];
  const subCommunities = Object.keys(subCommunityMap).length > 0 ? subCommunityMap : STATIC_SUB_COMMUNITIES as Record<string, string[]>;
  return (
    <>
      <Input
        label="Full Name"
        placeholder="Enter your full name"
        value={profile.fullName}
        onChange={(e) => updateField("fullName", e.target.value)}
      />
      <Input
        label="Date of Birth"
        type="date"
        value={profile.dateOfBirth}
        onChange={(e) => updateField("dateOfBirth", e.target.value)}
      />
      <Select
        label="Height"
        placeholder="Select height"
        options={HEIGHT_OPTIONS.map((h) => ({ value: h, label: h }))}
        value={profile.height}
        onValueChange={(val) => updateField("height", val)}
      />
      <Select
        label="Mother Tongue"
        placeholder="Select language"
        options={MOTHER_TONGUES.map((l) => ({ value: l, label: l }))}
        value={profile.motherTongue}
        onValueChange={(val) => updateField("motherTongue", val)}
      />
      <Select
        label="Community"
        placeholder="Select community"
        options={[
          { value: "no_community", label: "No Community" },
          ...communities.map((c) => ({ value: c, label: c })),
        ]}
        value={profile.community || ""}
        onValueChange={(val) => {
          updateField("community", val === "no_community" ? "" : val);
          if (val === "no_community") updateField("subCaste", "");
        }}
      />
      {profile.community && profile.community !== "no_community" && subCommunities[profile.community] && (
        <Select
          label="Sub-Community"
          placeholder="Select sub-community"
          options={subCommunities[profile.community].map((sc) => ({ value: sc, label: sc }))}
          value={profile.subCaste || ""}
          onValueChange={(val) => updateField("subCaste", val)}
        />
      )}
      <RadioGroup
        label="Marital Status"
        options={[
          { value: "never_married", label: "Never Married" },
          { value: "divorced", label: "Divorced" },
          { value: "widowed", label: "Widowed" },
          { value: "awaiting_divorce", label: "Awaiting Divorce" },
        ]}
        value={profile.maritalStatus}
        onValueChange={(val) => updateField("maritalStatus", val)}
        layout="horizontal"
      />
    </>
  );
}

function Step2Fields({ profile, updateField }: StepFieldsProps) {
  return (
    <>
      <Input
        label="Religion"
        placeholder="e.g., Hindu"
        value={profile.religion}
        onChange={(e) => updateField("religion", e.target.value)}
      />
      <Input
        label="Gothra"
        placeholder="Enter gothra (optional)"
        value={profile.gothra}
        onChange={(e) => updateField("gothra", e.target.value)}
      />
      <Select
        label="Star / Nakshatra"
        placeholder="Select nakshatra"
        options={NAKSHATRAS.map((n) => ({ value: n, label: n }))}
        value={profile.star}
        onValueChange={(val) => updateField("star", val)}
      />
      <Input
        label="Rashi"
        placeholder="Auto-calculated or enter manually"
        value={profile.rashi}
        onChange={(e) => updateField("rashi", e.target.value)}
      />
      <RadioGroup
        label="Dosham (Chevvai / Manglik)"
        options={[
          { value: "yes", label: "Yes" },
          { value: "no", label: "No" },
          { value: "dont_know", label: "Don't Know" },
        ]}
        value={profile.hasDosham}
        onValueChange={(val) => updateField("hasDosham", val)}
        layout="horizontal"
      />
      <RadioGroup
        label="Family Type"
        options={[
          { value: "joint", label: "Joint Family" },
          { value: "nuclear", label: "Nuclear Family" },
        ]}
        value={profile.familyType}
        onValueChange={(val) => updateField("familyType", val)}
        layout="horizontal"
      />
      <Select
        label="Family Status"
        placeholder="Select status"
        options={[
          { value: "middle", label: "Middle Class" },
          { value: "upper_middle", label: "Upper Middle Class" },
          { value: "rich", label: "Rich" },
          { value: "affluent", label: "Affluent" },
        ]}
        value={profile.familyStatus}
        onValueChange={(val) => updateField("familyStatus", val)}
      />
      <Input
        label="Father's Occupation"
        placeholder="e.g., Retired Government Officer"
        value={profile.fatherOccupation}
        onChange={(e) => updateField("fatherOccupation", e.target.value)}
      />
      <Input
        label="Mother's Occupation"
        placeholder="e.g., Homemaker"
        value={profile.motherOccupation}
        onChange={(e) => updateField("motherOccupation", e.target.value)}
      />
    </>
  );
}

function Step3Fields({ profile, updateField }: StepFieldsProps) {
  const allEducation = EDUCATION_LEVELS.flatMap((g) =>
    g.options.map((o) => ({ value: o, label: o, group: g.group }))
  );

  return (
    <>
      <Select
        label="Highest Degree"
        placeholder="Select degree"
        options={allEducation}
        value={profile.highestDegree}
        onValueChange={(val) => updateField("highestDegree", val)}
      />
      <Input
        label="Institution / University"
        placeholder="e.g., IIT Madras"
        value={profile.institution}
        onChange={(e) => updateField("institution", e.target.value)}
      />
      <Select
        label="Occupation"
        placeholder="Select occupation"
        options={OCCUPATIONS.map((o) => ({ value: o, label: o }))}
        value={profile.occupation}
        onValueChange={(val) => updateField("occupation", val)}
      />
      <Input
        label="Employer Name"
        placeholder="e.g., Infosys (optional)"
        value={profile.employer}
        onChange={(e) => updateField("employer", e.target.value)}
      />
      <Select
        label="Annual Income"
        placeholder="Select range"
        options={INCOME_RANGES.map((r) => ({ value: r, label: r }))}
        value={profile.annualIncome}
        onValueChange={(val) => updateField("annualIncome", val)}
      />
      <Input
        label="Work Location"
        placeholder="e.g., Chennai"
        value={profile.workLocation}
        onChange={(e) => updateField("workLocation", e.target.value)}
      />
      <Input
        label="WhatsApp Number (Optional)"
        placeholder="+91 98765 43210"
        value={profile.whatsappNumber}
        onChange={(e) => updateField("whatsappNumber", e.target.value)}
      />
      <p className="text-xs text-neutral-500 -mt-3">Premium members can reach you on WhatsApp for faster communication.</p>
    </>
  );
}

function Step4Fields({ profile, updateField }: StepFieldsProps) {
  const toggleHobby = (hobby: string) => {
    const current = profile.hobbies || [];
    if (current.includes(hobby)) {
      updateField("hobbies", current.filter((h) => h !== hobby));
    } else {
      updateField("hobbies", [...current, hobby]);
    }
  };

  return (
    <>
      <RadioGroup
        label="Diet"
        options={[
          { value: "vegetarian", label: "Vegetarian" },
          { value: "non_vegetarian", label: "Non-Vegetarian" },
          { value: "eggetarian", label: "Eggetarian" },
        ]}
        value={profile.diet}
        onValueChange={(val) => updateField("diet", val)}
        layout="horizontal"
      />
      <RadioGroup
        label="Smoking"
        options={[
          { value: "no", label: "No" },
          { value: "occasionally", label: "Occasionally" },
          { value: "yes", label: "Yes" },
        ]}
        value={profile.smoking}
        onValueChange={(val) => updateField("smoking", val)}
        layout="horizontal"
      />
      <RadioGroup
        label="Drinking"
        options={[
          { value: "no", label: "No" },
          { value: "occasionally", label: "Occasionally" },
          { value: "yes", label: "Yes" },
        ]}
        value={profile.drinking}
        onValueChange={(val) => updateField("drinking", val)}
        layout="horizontal"
      />
      <div>
        <span className="text-sm font-medium text-neutral-600 mb-2 block">Hobbies</span>
        <div className="flex flex-wrap gap-2">
          {HOBBIES.map((hobby) => (
            <button
              key={hobby}
              type="button"
              onClick={() => toggleHobby(hobby)}
              className={
                (profile.hobbies || []).includes(hobby)
                  ? "rounded-full border border-primary-500 bg-primary-50 px-3 py-1.5 text-sm font-medium text-primary-700 transition-colors"
                  : "rounded-full border border-neutral-200 px-3 py-1.5 text-sm text-neutral-700 hover:bg-primary-50 hover:border-primary-300 hover:text-primary-700 transition-colors"
              }
            >
              {hobby}
            </button>
          ))}
        </div>
      </div>
      <Textarea
        label="About Me"
        placeholder="Tell potential matches about yourself, your values, and what makes you unique..."
        maxLength={500}
        charCount
        hint="50-500 characters"
        value={profile.aboutMe}
        onChange={(e) => updateField("aboutMe", e.target.value)}
      />
      <Textarea
        label="What I'm Looking For"
        placeholder="Describe the qualities you value in a life partner..."
        maxLength={300}
        charCount
        hint="50-300 characters"
        value={profile.lookingFor}
        onChange={(e) => updateField("lookingFor", e.target.value)}
      />
    </>
  );
}

function Step5Fields() {
  const [photos, setPhotos] = useState<{ id: string; file?: File; preview: string; isPrimary: boolean }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [horoscopeFile, setHoroscopeFile] = useState<File | null>(null);
  const [horoscopeUploaded, setHoroscopeUploaded] = useState(false);
  const [verificationFile, setVerificationFile] = useState<File | null>(null);
  const [verificationSubmitted, setVerificationSubmitted] = useState(false);
  const horoscopeInputRef = useRef<HTMLInputElement>(null);
  const verificationInputRef = useRef<HTMLInputElement>(null);

  // Load existing photos from profile
  useEffect(() => {
    fetch("/api/profiles/me")
      .then((res) => res.json())
      .then((data) => {
        const existing = (data.profile?.photos || []).map((p: any, i: number) => ({
          id: p._id?.toString() || `existing-${i}`,
          preview: p.url || "",
          isPrimary: p.isPrimary || false,
        }));
        if (existing.length > 0) setPhotos(existing);
        if (data.profile?.horoscopeUrl) setHoroscopeUploaded(true);
        if (data.profile?.verificationStatus === "pending" || data.profile?.verificationStatus === "verified") {
          setVerificationSubmitted(true);
        }
      })
      .catch(() => {});
  }, []);

  const handleAddPhotos = async (files: File[]) => {
    setUploading(true);
    try {
      const formData = new FormData();
      files.forEach((f) => formData.append("files", f));

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();

      const newPhotos = (data.files || []).map((f: any, i: number) => ({
        id: `new-${Date.now()}-${i}`,
        preview: f.url,
        isPrimary: photos.length === 0 && i === 0,
      }));

      const allPhotos = [...photos, ...newPhotos];
      setPhotos(allPhotos);

      // Save to profile
      await fetch("/api/profiles/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photos: allPhotos.map((p, idx) => ({
            url: p.preview,
            isPrimary: p.isPrimary,
            order: idx,
          })),
        }),
      });
    } catch (err) {
      console.error("Photo upload error:", err);
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = async (id: string) => {
    const updated = photos.filter((p) => p.id !== id);
    if (updated.length > 0 && !updated.some((p) => p.isPrimary)) {
      updated[0].isPrimary = true;
    }
    setPhotos(updated);

    await fetch("/api/profiles/me", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        photos: updated.map((p, idx) => ({
          url: p.preview,
          isPrimary: p.isPrimary,
          order: idx,
        })),
      }),
    }).catch(() => {});
  };

  const handleSetPrimary = async (id: string) => {
    const updated = photos.map((p) => ({ ...p, isPrimary: p.id === id }));
    setPhotos(updated);

    await fetch("/api/profiles/me", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        photos: updated.map((p, idx) => ({
          url: p.preview,
          isPrimary: p.isPrimary,
          order: idx,
        })),
      }),
    }).catch(() => {});
  };

  const handleHoroscopeUpload = async (file: File) => {
    setHoroscopeFile(file);
    const formData = new FormData();
    formData.append("files", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      const url = data.files?.[0]?.url;
      if (url) {
        await fetch("/api/profiles/me", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ horoscopeUrl: url }),
        });
        setHoroscopeUploaded(true);
      }
    } catch (err) {
      console.error("Horoscope upload error:", err);
    }
  };

  const handleVerificationUpload = async (file: File) => {
    setVerificationFile(file);
    const formData = new FormData();
    formData.append("files", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      const url = data.files?.[0]?.url;
      if (url) {
        await fetch("/api/admin/verifications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            documentType: "aadhaar",
            documentUrl: url,
          }),
        });
        setVerificationSubmitted(true);
      }
    } catch (err) {
      console.error("Verification upload error:", err);
    }
  };

  return (
    <>
      <div>
        <span className="text-sm font-medium text-neutral-600 mb-3 block">
          Profile Photos {uploading && <span className="text-primary-600 text-xs ml-2">Uploading...</span>}
        </span>
        <PhotoUploadZone
          photos={photos}
          onAdd={handleAddPhotos}
          onRemove={handleRemovePhoto}
          onSetPrimary={handleSetPrimary}
        />
      </div>

      <div className="rounded-[var(--radius-lg)] border border-neutral-200 bg-neutral-50 p-4">
        <h3 className="text-sm font-semibold text-neutral-800">Upload Horoscope (Optional)</h3>
        <p className="text-xs text-neutral-500 mt-0.5">
          Your horoscope enables star-based matching with other profiles.
        </p>
        {horoscopeUploaded ? (
          <p className="mt-3 text-sm text-success font-medium">Horoscope uploaded successfully!</p>
        ) : (
          <div className="mt-3 flex items-center justify-center rounded-[var(--radius-md)] border-2 border-dashed border-neutral-300 bg-white p-6">
            <div className="text-center">
              <p className="text-sm text-neutral-500">
                {horoscopeFile ? horoscopeFile.name : "Drop JPG or PDF here"}
              </p>
              <input
                ref={horoscopeInputRef}
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleHoroscopeUpload(f);
                }}
              />
              <Button variant="ghost" size="sm" className="mt-2" onClick={() => horoscopeInputRef.current?.click()}>
                Browse Files
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-[var(--radius-lg)] border border-primary-200 bg-primary-50 p-4">
        <h3 className="text-sm font-semibold text-primary-800">ID Verification</h3>
        <p className="text-xs text-primary-700 mt-0.5">
          Verified profiles get 40% more responses. Upload Aadhaar, Passport, or Voter ID.
        </p>
        {verificationSubmitted ? (
          <p className="mt-3 text-sm text-success font-medium">Verification submitted! We'll review it within 24 hours.</p>
        ) : (
          <>
            <input
              ref={verificationInputRef}
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleVerificationUpload(f);
              }}
            />
            <Button variant="secondary" size="sm" className="mt-3" onClick={() => verificationInputRef.current?.click()}>
              {verificationFile ? verificationFile.name : "Verify Now"}
            </Button>
          </>
        )}
      </div>
    </>
  );
}

function Step6Fields({ profile, updateField }: StepFieldsProps) {
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Age (Min)"
          type="number"
          placeholder="21"
          value={profile.pp_ageMin || ""}
          onChange={(e) => updateField("pp_ageMin", e.target.value)}
        />
        <Input
          label="Age (Max)"
          type="number"
          placeholder="30"
          value={profile.pp_ageMax || ""}
          onChange={(e) => updateField("pp_ageMax", e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Height (Min)"
          placeholder={"4'10\""}
          options={HEIGHT_OPTIONS.map((h) => ({ value: h, label: h }))}
          value={profile.pp_heightMin || ""}
          onValueChange={(val) => updateField("pp_heightMin", val)}
        />
        <Select
          label="Height (Max)"
          placeholder={"6'0\""}
          options={HEIGHT_OPTIONS.map((h) => ({ value: h, label: h }))}
          value={profile.pp_heightMax || ""}
          onValueChange={(val) => updateField("pp_heightMax", val)}
        />
      </div>
      <Select
        label="Education"
        placeholder="Select preferred education"
        options={EDUCATION_LEVELS.flatMap((g) =>
          g.options.map((o) => ({ value: o, label: o, group: g.group }))
        )}
        value={profile.pp_education || ""}
        onValueChange={(val) => updateField("pp_education", val)}
      />
      <Select
        label="Occupation"
        placeholder="Select preferred occupation"
        options={OCCUPATIONS.map((o) => ({ value: o, label: o }))}
        value={profile.pp_occupation || ""}
        onValueChange={(val) => updateField("pp_occupation", val)}
      />
      <Select
        label="Community"
        placeholder="Any community or select specific"
        options={[
          { value: "any", label: "Any Community" },
          ...[...STATIC_COMMUNITIES].map((c) => ({ value: c, label: c })),
        ]}
        value={profile.pp_community || ""}
        onValueChange={(val) => updateField("pp_community", val)}
      />
      <Input
        label="Preferred Location"
        placeholder="e.g., Chennai, Bangalore"
        value={profile.pp_location || ""}
        onChange={(e) => updateField("pp_location", e.target.value)}
      />
      <RadioGroup
        label="Star Compatibility"
        options={[
          { value: "must", label: "Must Match" },
          { value: "preferred", label: "Preferred" },
          { value: "not_important", label: "Not Important" },
        ]}
        value={profile.pp_starCompatibility || "preferred"}
        onValueChange={(val) => updateField("pp_starCompatibility", val)}
        layout="horizontal"
      />
      <RadioGroup
        label="Dosham"
        options={[
          { value: "must_not", label: "Must Not Have" },
          { value: "doesnt_matter", label: "Doesn't Matter" },
        ]}
        value={profile.pp_dosham || "doesnt_matter"}
        onValueChange={(val) => updateField("pp_dosham", val)}
        layout="horizontal"
      />
      <RadioGroup
        label="Diet Preference"
        options={[
          { value: "must_veg", label: "Must Be Vegetarian" },
          { value: "doesnt_matter", label: "Doesn't Matter" },
        ]}
        value={profile.pp_diet || "doesnt_matter"}
        onValueChange={(val) => updateField("pp_diet", val)}
        layout="horizontal"
      />
    </>
  );
}
