"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button, Card, Badge, Progress, Tabs, TabsList, TabsTrigger, TabsContent, Input, Select, Checkbox } from "@/components/ui";
import { Textarea } from "@/components/ui";
import { VerifiedBadge, PhotoUploadZone } from "@/components/domain";
import { Eye, Loader2, FileText, Upload, Trash2, ExternalLink, ShieldCheck, ShieldAlert } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import {
  MOTHER_TONGUES,
  COMMUNITIES as STATIC_COMMUNITIES,
  SUB_COMMUNITIES as STATIC_SUB_COMMUNITIES,
  NAKSHATRAS,
  RASHIS,
  EDUCATION_LEVELS,
  OCCUPATIONS,
  INCOME_RANGES,
  HEIGHT_OPTIONS,
  HOBBIES,
  STATES,
  STATE_CITIES,
  FAMILY_TYPE_OPTIONS,
  FAMILY_STATUS_OPTIONS,
  MARITAL_STATUS_OPTIONS,
  DOSHAM_OPTIONS,
  DIET_OPTIONS,
  SMOKING_OPTIONS,
  DRINKING_OPTIONS,
  STAR_COMPATIBILITY_OPTIONS,
  DOSHAM_PREF_OPTIONS,
  DIET_PREF_OPTIONS,
  EMPLOYMENT_TYPE_OPTIONS,
  CITIZENSHIP_OPTIONS,
  CHILDREN_ACCEPTABLE_OPTIONS,
  SMOKING_PREF_OPTIONS,
  DRINKING_PREF_OPTIONS,
  COMPLEXION_OPTIONS,
  PHYSICAL_DISABILITY_PREF_OPTIONS,
  FAMILY_TYPE_PREF_OPTIONS,
} from "@/lib/constants";

export default function MyProfilePage() {
  const { t } = useTranslation();
  const { update: updateSession } = useSession();
  const [saved, setSaved] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileComplete, setProfileComplete] = useState(0);

  // Basic Info
  const [fullName, setFullName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [height, setHeight] = useState("");
  const [motherTongue, setMotherTongue] = useState("");
  const [community, setCommunity] = useState("");
  const [subCaste, setSubCaste] = useState("");
  const [maritalStatus, setMaritalStatus] = useState("never_married");

  // Family
  const [religion, setReligion] = useState("Hindu");
  const [gothra, setGothra] = useState("");
  const [star, setStar] = useState("");
  const [rashi, setRashi] = useState("");
  const [dosham, setDosham] = useState("");
  const [familyType, setFamilyType] = useState("");
  const [familyStatus, setFamilyStatus] = useState("");
  const [fatherOccupation, setFatherOccupation] = useState("");
  const [motherOccupation, setMotherOccupation] = useState("");

  // Career
  const [highestDegree, setHighestDegree] = useState("");
  const [institution, setInstitution] = useState("");
  const [occupation, setOccupation] = useState("");
  const [employer, setEmployer] = useState("");
  const [annualIncome, setAnnualIncome] = useState("");
  const [workLocation, setWorkLocation] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");

  // About
  const [aboutMe, setAboutMe] = useState("");
  const [lookingFor, setLookingFor] = useState("");
  const [diet, setDiet] = useState("vegetarian");
  const [smoking, setSmoking] = useState("no");
  const [drinking, setDrinking] = useState("no");
  const [selectedHobbies, setSelectedHobbies] = useState<Set<string>>(new Set());

  // Photos
  const [photos, setPhotos] = useState<{ id: string; preview: string; isPrimary: boolean }[]>([]);
  const [verificationStatus, setVerificationStatus] = useState<"unverified"|"pending"|"verified"|"rejected">("unverified");
  const [verificationRejectionReason, setVerificationRejectionReason] = useState("");
  const [verDocType, setVerDocType] = useState("aadhaar");
  const [verDocFile, setVerDocFile] = useState<File | null>(null);
  const [verSelfieFile, setVerSelfieFile] = useState<File | null>(null);
  const [verUploading, setVerUploading] = useState(false);
  const [horoscopeUrl, setHoroscopeUrl] = useState("");
  const [horoscopeUploading, setHoroscopeUploading] = useState(false);

  const DOC_TYPE_OPTIONS = [
    { value: "aadhaar",          label: "Aadhaar Card" },
    { value: "passport",         label: "Passport" },
    { value: "voter_id",         label: "Voter ID" },
    { value: "driving_license",  label: "Driving License" },
  ];

  // Dynamic communities from DB
  const [dbCommunities, setDbCommunities] = useState<string[]>([]);
  const [dbSubCommunities, setDbSubCommunities] = useState<Record<string, string[]>>({});

  // Partner Preferences — Basic
  const [prefAgeMin, setPrefAgeMin] = useState("22");
  const [prefAgeMax, setPrefAgeMax] = useState("32");
  const [prefHeightMin, setPrefHeightMin] = useState("");
  const [prefHeightMax, setPrefHeightMax] = useState("");
  const [prefMaritalStatus, setPrefMaritalStatus] = useState<Set<string>>(new Set());
  const [prefChildrenOk, setPrefChildrenOk] = useState("doesnt_matter");
  // Community & Language
  const [prefMotherTongues, setPrefMotherTongues] = useState<Set<string>>(new Set());
  const [prefCommunities, setPrefCommunities] = useState<Set<string>>(new Set());
  const [prefGothra, setPrefGothra] = useState("");
  // Education & Career
  const [prefEducation, setPrefEducation] = useState("");
  const [prefOccupation, setPrefOccupation] = useState("");
  const [prefEmploymentType, setPrefEmploymentType] = useState("any");
  const [prefIncomeMin, setPrefIncomeMin] = useState("");
  // Location & Residency
  const [prefState, setPrefState] = useState("");
  const [prefCity, setPrefCity] = useState("");
  const [prefCitizenship, setPrefCitizenship] = useState("any");
  // Horoscope
  const [prefStarCompat, setPrefStarCompat] = useState("preferred");
  const [prefDosham, setPrefDosham] = useState("doesnt_matter");
  // Lifestyle
  const [prefDiet, setPrefDiet] = useState("doesnt_matter");
  const [prefSmokingOk, setPrefSmokingOk] = useState("no");
  const [prefDrinkingOk, setPrefDrinkingOk] = useState("no");
  // Family
  const [prefFamilyType, setPrefFamilyType] = useState("any");
  const [prefFamilyStatus, setPrefFamilyStatus] = useState<Set<string>>(new Set());
  // Physical
  const [prefComplexion, setPrefComplexion] = useState("any");
  const [prefDisability, setPrefDisability] = useState("doesnt_matter");

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

  // Fetch profile data on mount
  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/profiles/me");
        if (!res.ok) return;
        const data = await res.json();
        const p = data.profile || {};
        const u = data.user || {};
        const pp = data.partnerPreferences || {};

        // Basic
        setFullName(p.fullName || "");
        setDateOfBirth(p.dateOfBirth || "");
        setHeight(p.height || "");
        setMotherTongue(p.motherTongue || "");
        setCommunity(p.community || "");
        setSubCaste(p.subCaste || "");
        setMaritalStatus(p.maritalStatus || "never_married");
        setProfileComplete(u.profileComplete || 0);

        // Family
        setReligion(p.religion || "Hindu");
        setGothra(p.gothra || "");
        setStar(p.star || "");
        setRashi(p.rashi || "");
        setDosham(p.hasDosham === true ? "Chevvai Dosham" : p.hasDosham === false ? "No Dosham" : (typeof p.hasDosham === "string" ? p.hasDosham : ""));
        setFamilyType(p.familyType === "joint" ? "Joint Family" : p.familyType === "nuclear" ? "Nuclear Family" : (p.familyType || ""));
        setFamilyStatus(p.familyStatus || "");
        setFatherOccupation(p.fatherOccupation || "");
        setMotherOccupation(p.motherOccupation || "");

        // Career
        setHighestDegree(p.highestDegree || "");
        setInstitution(p.institution || "");
        setOccupation(p.occupation || "");
        setEmployer(p.employer || "");
        setAnnualIncome(p.annualIncome || "");
        setWorkLocation(p.workLocation || "");
        setState(p.state || "");
        setCity(p.city || "");
        setWhatsappNumber(p.whatsappNumber || "");

        // About
        setAboutMe(p.aboutMe || "");
        setLookingFor(p.lookingFor || "");
        setDiet(p.diet || "vegetarian");
        setSmoking(p.smoking || "no");
        setDrinking(p.drinking || "no");
        setSelectedHobbies(new Set(p.hobbies || []));

        // Photos
        if (p.photos && p.photos.length > 0) {
          setPhotos(p.photos.map((ph: any, i: number) => ({
            id: ph._id?.toString() || String(i),
            preview: ph.url || "",
            isPrimary: ph.isPrimary || false,
          })));
        }
        const vs = p.verificationStatus || "unverified";
        setVerificationStatus(vs as any);
        setHoroscopeUrl(p.horoscopeUrl || "");

        // Load rejection reason if status is rejected
        if (vs === "rejected") {
          fetch("/api/admin/verifications?myStatus=true")
            .then(r => r.json())
            .then(d => {
              const rejected = (d.verifications || []).find((v: any) => v.status === "rejected");
              if (rejected?.rejectionReason) setVerificationRejectionReason(rejected.rejectionReason);
            })
            .catch(() => {});
        }

        // Partner Preferences
        if (pp.ageRange) {
          setPrefAgeMin(String(pp.ageRange[0] || 22));
          setPrefAgeMax(String(pp.ageRange[1] || 32));
        }
        if (pp.heightRange) {
          setPrefHeightMin(pp.heightRange[0] || "");
          setPrefHeightMax(pp.heightRange[1] || "");
        }
        setPrefMaritalStatus(new Set(pp.maritalStatus || []));
        setPrefChildrenOk(pp.childrenAcceptable || "doesnt_matter");
        setPrefMotherTongues(new Set(pp.motherTongues || []));
        setPrefCommunities(new Set(pp.communities || []));
        setPrefGothra(pp.gothra || "");
        setPrefEducation((pp.education || [])[0] || "");
        setPrefOccupation((pp.occupation || [])[0] || "");
        setPrefEmploymentType(pp.employmentType || "any");
        setPrefIncomeMin(pp.annualIncomeMin || "");
        if (pp.locations && pp.locations.length > 0) {
          setPrefState(pp.locations[0] || "");
        }
        setPrefCitizenship(pp.citizenship || "any");
        setPrefStarCompat(pp.starCompatibility || "preferred");
        setPrefDosham(pp.dosham || "doesnt_matter");
        setPrefDiet(pp.diet || "doesnt_matter");
        setPrefSmokingOk(pp.smokingAcceptable || "no");
        setPrefDrinkingOk(pp.drinkingAcceptable || "no");
        setPrefFamilyType(pp.familyType || "any");
        setPrefFamilyStatus(new Set(pp.familyStatus || []));
        setPrefComplexion(pp.complexion || "any");
        setPrefDisability(pp.physicalDisability || "doesnt_matter");
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  const handleSave = useCallback(async (section: string) => {
    setSaving(true);
    setSaveError(null);
    try {
      const profileData: any = {
        fullName,
        dateOfBirth,
        height,
        motherTongue,
        community,
        subCaste,
        maritalStatus,
        religion,
        gothra,
        star,
        rashi,
        hasDosham: dosham === "No Dosham" ? false : dosham === "Chevvai Dosham" || dosham === "Rahu-Ketu Dosham" ? true : null,
        familyType: familyType === "Joint Family" ? "joint" : familyType === "Nuclear Family" ? "nuclear" : familyType || undefined,
        familyStatus,
        fatherOccupation,
        motherOccupation,
        highestDegree,
        institution,
        occupation,
        employer,
        annualIncome,
        workLocation,
        state,
        city,
        whatsappNumber,
        aboutMe,
        lookingFor,
        diet,
        smoking,
        drinking,
        hobbies: Array.from(selectedHobbies),
      };

      if (section === "preferences") {
        profileData.partnerPreferences = {
          ageRange: [Number(prefAgeMin), Number(prefAgeMax)],
          heightRange: [prefHeightMin, prefHeightMax],
          maritalStatus: Array.from(prefMaritalStatus),
          childrenAcceptable: prefChildrenOk,
          motherTongues: Array.from(prefMotherTongues),
          communities: Array.from(prefCommunities),
          gothra: prefGothra,
          education: prefEducation ? [prefEducation] : [],
          occupation: prefOccupation ? [prefOccupation] : [],
          employmentType: prefEmploymentType,
          annualIncomeMin: prefIncomeMin,
          locations: prefState ? [prefState] : [],
          citizenship: prefCitizenship,
          starCompatibility: prefStarCompat,
          dosham: prefDosham,
          diet: prefDiet,
          smokingAcceptable: prefSmokingOk,
          drinkingAcceptable: prefDrinkingOk,
          familyType: prefFamilyType,
          familyStatus: Array.from(prefFamilyStatus),
          complexion: prefComplexion,
          physicalDisability: prefDisability,
        };
      }

      const res = await fetch("/api/profiles/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileData),
      });

      if (res.ok) {
        const data = await res.json();
        const newComplete = data.profileComplete ?? profileComplete;
        setProfileComplete(newComplete);
        // Push the updated value into the JWT so the dashboard + sidebar stay in sync
        updateSession({ profileComplete: newComplete }).catch(() => {});
        setSaved(section);
        setTimeout(() => setSaved(null), 2000);
      } else {
        const errData = await res.json().catch(() => ({}));
        setSaveError(errData.error || "Failed to save. Please try again.");
        setTimeout(() => setSaveError(null), 4000);
      }
    } catch (err) {
      console.error("Failed to save:", err);
      setSaveError("Network error. Please check your connection.");
      setTimeout(() => setSaveError(null), 4000);
    } finally {
      setSaving(false);
    }
  }, [
    fullName, dateOfBirth, height, motherTongue, community, subCaste, maritalStatus,
    religion, gothra, star, rashi, dosham, familyType, familyStatus, fatherOccupation, motherOccupation,
    highestDegree, institution, occupation, employer, annualIncome, workLocation, state, city, whatsappNumber,
    aboutMe, lookingFor, diet, smoking, drinking, selectedHobbies,
    prefAgeMin, prefAgeMax, prefHeightMin, prefHeightMax, prefMaritalStatus, prefChildrenOk,
    prefMotherTongues, prefCommunities, prefGothra, prefEducation, prefOccupation, prefEmploymentType,
    prefIncomeMin, prefState, prefCitizenship, prefStarCompat, prefDosham, prefDiet,
    prefSmokingOk, prefDrinkingOk, prefFamilyType, prefFamilyStatus, prefComplexion, prefDisability,
    profileComplete,
  ]);

  const toggleHobby = (hobby: string) => {
    setSelectedHobbies((prev) => {
      const next = new Set(prev);
      if (next.has(hobby)) next.delete(hobby);
      else next.add(hobby);
      return next;
    });
  };

  const togglePrefCommunity = (c: string) => {
    setPrefCommunities((prev) => {
      const next = new Set(prev);
      if (next.has(c)) next.delete(c);
      else next.add(c);
      return next;
    });
  };

  const togglePrefMarital = (s: string) => {
    setPrefMaritalStatus((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
  };

  const togglePrefMotherTongue = (l: string) => {
    setPrefMotherTongues((prev) => {
      const next = new Set(prev);
      if (next.has(l)) next.delete(l);
      else next.add(l);
      return next;
    });
  };

  const togglePrefFamilyStatus = (s: string) => {
    setPrefFamilyStatus((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
  };

  // Photo handlers
  const handleAddPhotos = useCallback(async (files: File[]) => {
    const formData = new FormData();
    files.forEach((f) => formData.append("files", f));

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) return;
      const data = await res.json();
      const newPhotos = (data.files || []).map((f: any, i: number) => ({
        id: `new_${Date.now()}_${i}`,
        preview: f.url,
        isPrimary: photos.length === 0 && i === 0,
      }));

      const updated = [...photos, ...newPhotos];
      setPhotos(updated);

      // Save to profile
      const saveRes = await fetch("/api/profiles/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photos: updated.map((p, idx) => ({
            url: p.preview,
            isPrimary: p.isPrimary,
            order: idx,
          })),
        }),
      });
      if (saveRes.ok) {
        const saveData = await saveRes.json();
        const newComplete = saveData.profileComplete ?? profileComplete;
        setProfileComplete(newComplete);
        updateSession({ profileComplete: newComplete }).catch(() => {});
      }
    } catch (err) {
      console.error("Photo upload failed:", err);
    }
  }, [photos, profileComplete, updateSession]);

  const handleRemovePhoto = useCallback(async (id: string) => {
    const updated = photos.filter((p) => p.id !== id);
    // If removed photo was primary, make first one primary
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
    });
  }, [photos]);

  const handleSetPrimary = useCallback(async (id: string) => {
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
    });
  }, [photos]);

  const handleVerificationSubmit = useCallback(async () => {
    if (!verDocFile) return;
    setVerUploading(true);
    try {
      // Upload document
      const docForm = new FormData();
      docForm.append("files", verDocFile);
      const docRes = await fetch("/api/upload", { method: "POST", body: docForm });
      if (!docRes.ok) throw new Error("Document upload failed");
      const docData = await docRes.json();
      const documentUrl = docData.files?.[0]?.url;
      if (!documentUrl) throw new Error("No URL returned");

      // Upload selfie if provided
      let selfieUrl = "";
      if (verSelfieFile) {
        const selfieForm = new FormData();
        selfieForm.append("files", verSelfieFile);
        const selfieRes = await fetch("/api/upload", { method: "POST", body: selfieForm });
        if (selfieRes.ok) {
          const selfieData = await selfieRes.json();
          selfieUrl = selfieData.files?.[0]?.url || "";
        }
      }

      const submitRes = await fetch("/api/admin/verifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentType: verDocType, documentUrl, selfieUrl }),
      });
      if (!submitRes.ok) throw new Error("Submission failed");

      setVerificationStatus("pending");
      setVerificationRejectionReason("");
      setVerDocFile(null);
      setVerSelfieFile(null);
    } catch (err) {
      console.error("Verification submit error:", err);
    } finally {
      setVerUploading(false);
    }
  }, [verDocFile, verSelfieFile, verDocType]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900">{t.profile.myProfile}</h1>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm">
            <Eye className="h-4 w-4" /> {t.profile.preview}
          </Button>
        </div>
      </div>

      {/* Completion card */}
      <Card variant="alert" padding="lg" className="border-l-primary-600 bg-primary-50">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-neutral-900">{t.profile.profileCompletion}</h2>
            <p className="text-sm text-neutral-500 mt-0.5">
              {t.profile.completeProfileHint}
            </p>
            <Progress value={profileComplete} showPercentage size="md" className="mt-3 max-w-xs" />
          </div>
          <div className="flex flex-col gap-1 text-sm">
            {profileComplete < 100 && (() => {
              // Compute which required fields are actually missing
              const missing: string[] = [];
              if (!fullName.trim())        missing.push(t.profile.fullName);
              if (!dateOfBirth)            missing.push(t.profile.dateOfBirth);
              if (!height)                 missing.push(t.profile.height);
              if (!motherTongue)           missing.push(t.profile.motherTongue);
              if (!community)              missing.push("Community");
              if (!maritalStatus || maritalStatus === "") missing.push(t.profile.maritalStatus);
              if (!highestDegree)          missing.push(t.profile.highestDegree);
              if (!occupation)             missing.push(t.profile.occupationLabel);
              if (!city)                   missing.push("City");
              if (!aboutMe.trim())         missing.push(t.profile.aboutMe);
              if (photos.length === 0)     missing.push(t.profile.photos);
              // Only show horoscope/verification as missing if genuinely not done
              if (!horoscopeUrl)           missing.push(t.profile.horoscope);
              if (verificationStatus !== "verified" && verificationStatus !== "pending")
                missing.push(t.profile.idVerification);

              return missing.length > 0 ? (
                <span className="text-error font-medium">
                  {t.profile.missing}: {missing.join(", ")}
                </span>
              ) : null;
            })()}
          </div>
        </div>
      </Card>

      {/* Profile sections */}
      <Tabs defaultValue="basic">
        <TabsList>
          <TabsTrigger value="photos">
            <span className="sm:hidden">Photos</span>
            <span className="hidden sm:inline">{t.profile.photos}</span>
          </TabsTrigger>
          <TabsTrigger value="basic">
            <span className="sm:hidden">Basic</span>
            <span className="hidden sm:inline">{t.profile.basicInfo}</span>
          </TabsTrigger>
          <TabsTrigger value="family">
            <span className="sm:hidden">Family</span>
            <span className="hidden sm:inline">{t.profile.family}</span>
          </TabsTrigger>
          <TabsTrigger value="career">
            <span className="sm:hidden">Career</span>
            <span className="hidden sm:inline">{t.profile.career}</span>
          </TabsTrigger>
          <TabsTrigger value="about">
            <span className="sm:hidden">About</span>
            <span className="hidden sm:inline">{t.profile.about}</span>
          </TabsTrigger>
          <TabsTrigger value="preferences">
            <span className="sm:hidden">Prefs</span>
            <span className="hidden sm:inline">{t.profile.partnerPrefs}</span>
          </TabsTrigger>
        </TabsList>

        {/* ─── Photos ─── */}
        <TabsContent value="photos">
          <Card variant="flat" padding="lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-neutral-900">{t.profile.profilePhotos}</h3>
                <p className="text-xs text-neutral-500">{t.profile.uploadPhotos}</p>
              </div>
              <VerifiedBadge status={verificationStatus as any} />
            </div>
            <PhotoUploadZone
              photos={photos}
              onAdd={handleAddPhotos}
              onRemove={handleRemovePhoto}
              onSetPrimary={handleSetPrimary}
            />
          </Card>

          {/* Horoscope file upload */}
          <Card variant="flat" padding="lg" className="mt-4">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="h-5 w-5 text-primary-600" />
              <h3 className="text-base font-semibold text-neutral-900">Horoscope / Jathagam</h3>
            </div>
            <p className="text-sm text-neutral-500 mb-4">Upload your horoscope document (PDF, JPG, or PNG). This is shared only with your accepted matches.</p>
            {horoscopeUrl ? (
              <div className="flex items-center gap-3 rounded-[var(--radius-md)] border border-neutral-200 bg-neutral-50 px-4 py-3">
                <FileText className="h-5 w-5 text-primary-500 shrink-0" />
                <span className="flex-1 text-sm text-neutral-700 truncate">Horoscope uploaded</span>
                <a href={horoscopeUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 text-neutral-500 hover:text-primary-600 transition-colors">
                  <ExternalLink className="h-4 w-4" />
                </a>
                <button
                  onClick={async () => {
                    setHoroscopeUrl("");
                    await fetch("/api/profiles/me", {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ horoscopeUrl: "" }),
                    });
                  }}
                  className="p-1.5 text-neutral-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center gap-2 rounded-[var(--radius-lg)] border-2 border-dashed border-neutral-300 bg-neutral-50 p-6 cursor-pointer hover:border-primary-400 hover:bg-primary-50/30 transition-colors">
                {horoscopeUploading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
                ) : (
                  <Upload className="h-6 w-6 text-neutral-400" />
                )}
                <span className="text-sm font-medium text-neutral-600">
                  {horoscopeUploading ? "Uploading..." : "Click to upload horoscope"}
                </span>
                <span className="text-xs text-neutral-400">PDF, JPG or PNG · max 5 MB</span>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="sr-only"
                  disabled={horoscopeUploading}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (file.size > 5 * 1024 * 1024) { alert("File must be under 5 MB"); return; }
                    setHoroscopeUploading(true);
                    try {
                      const form = new FormData();
                      form.append("files", file);
                      const res = await fetch("/api/upload", { method: "POST", body: form });
                      if (!res.ok) throw new Error("Upload failed");
                      const data = await res.json();
                      const url = data.files?.[0]?.url;
                      if (!url) throw new Error("No URL returned");
                      setHoroscopeUrl(url);
                      await fetch("/api/profiles/me", {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ horoscopeUrl: url }),
                      });
                    } catch (err) {
                      console.error("Horoscope upload failed:", err);
                    } finally {
                      setHoroscopeUploading(false);
                      e.target.value = "";
                    }
                  }}
                />
              </label>
            )}
          </Card>
          {/* ID Verification card */}
          <Card variant="flat" padding="lg" className="mt-4" id="verification">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary-600" />
                <h3 className="text-base font-semibold text-neutral-900">ID Verification</h3>
              </div>
              <VerifiedBadge status={verificationStatus as any} />
            </div>

            {/* Verified */}
            {verificationStatus === "verified" && (
              <p className="text-sm text-green-700 font-medium flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                Your identity is verified. Your profile shows the Verified badge.
              </p>
            )}

            {/* Pending */}
            {verificationStatus === "pending" && (
              <p className="text-sm text-amber-700">
                ⏳ Your document is under review. We'll notify you within 24 hours.
              </p>
            )}

            {/* Rejected */}
            {verificationStatus === "rejected" && (
              <div className="rounded-[var(--radius-md)] bg-red-50 border border-red-200 p-3 mb-3">
                <p className="text-sm font-semibold text-red-700 flex items-center gap-1.5">
                  <ShieldAlert className="h-4 w-4" /> Verification rejected
                </p>
                {verificationRejectionReason && (
                  <p className="text-xs text-red-600 mt-1">{verificationRejectionReason}</p>
                )}
                <p className="text-xs text-red-500 mt-1">Please re-submit a clearer document below.</p>
              </div>
            )}

            {/* Unverified info */}
            {verificationStatus === "unverified" && (
              <p className="text-sm text-neutral-500 mb-3">
                Verified profiles get <strong>40% more responses</strong> and rank higher in search.
                Upload a government-issued ID to get verified.
              </p>
            )}

            {/* Upload form — shown for unverified or rejected */}
            {(verificationStatus === "unverified" || verificationStatus === "rejected") && (
              <div className="space-y-3 mt-3">
                {/* Document type */}
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">Document Type</label>
                  <select
                    value={verDocType}
                    onChange={(e) => setVerDocType(e.target.value)}
                    className="w-full rounded-[var(--radius-md)] border border-neutral-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                  >
                    {DOC_TYPE_OPTIONS.map((d) => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </select>
                </div>

                {/* Document file */}
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">
                    Upload ID Document <span className="text-neutral-400">(Image or PDF)</span>
                  </label>
                  <label className="flex items-center gap-3 rounded-[var(--radius-md)] border-2 border-dashed border-neutral-300 bg-neutral-50 px-4 py-3 cursor-pointer hover:border-primary-400 hover:bg-primary-50/30 transition-colors">
                    <FileText className="h-5 w-5 text-neutral-400 shrink-0" />
                    <span className="text-sm text-neutral-600 truncate">
                      {verDocFile ? verDocFile.name : "Click to choose file"}
                    </span>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      className="sr-only"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) setVerDocFile(f); }}
                    />
                  </label>
                </div>

                {/* Selfie file (optional) */}
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">
                    Selfie with ID <span className="text-neutral-400">(Optional — increases approval rate)</span>
                  </label>
                  <label className="flex items-center gap-3 rounded-[var(--radius-md)] border-2 border-dashed border-neutral-200 bg-neutral-50 px-4 py-3 cursor-pointer hover:border-primary-300 hover:bg-primary-50/20 transition-colors">
                    <Eye className="h-5 w-5 text-neutral-400 shrink-0" />
                    <span className="text-sm text-neutral-500 truncate">
                      {verSelfieFile ? verSelfieFile.name : "Click to add selfie"}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) setVerSelfieFile(f); }}
                    />
                  </label>
                </div>

                <Button
                  variant="primary"
                  size="md"
                  fullWidth
                  disabled={!verDocFile || verUploading}
                  onClick={handleVerificationSubmit}
                >
                  {verUploading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Uploading…</>
                  ) : (
                    <><ShieldCheck className="h-4 w-4" /> Submit for Verification</>
                  )}
                </Button>
              </div>
            )}
          </Card>

        </TabsContent>

        {/* ─── Basic Info ─── */}
        <TabsContent value="basic">
          <Card variant="flat" padding="lg" className="space-y-5">
            <Input
              label={t.profile.fullName}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your full name"
            />
            <Input
              label={t.profile.dateOfBirth}
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
            />
            <Select
              label={t.profile.height}
              value={height || undefined}
              onValueChange={setHeight}
              placeholder="Select height"
              options={HEIGHT_OPTIONS.map((h) => ({ value: h, label: h }))}
            />
            <Select
              label={t.profile.motherTongue}
              value={motherTongue || undefined}
              onValueChange={setMotherTongue}
              placeholder="Select language"
              options={MOTHER_TONGUES.map((l) => ({ value: l, label: l }))}
            />
            <Select
              label={t.profile.communityLabel}
              value={community || undefined}
              onValueChange={(val) => {
                setCommunity(val === "no_community" ? "" : val);
                if (val === "no_community") setSubCaste("");
              }}
              placeholder="Select community"
              options={[
                { value: "no_community", label: "No Community" },
                ...(dbCommunities.length > 0 ? dbCommunities : [...STATIC_COMMUNITIES]).map((c) => ({ value: c, label: c })),
              ]}
            />
            {community && community !== "no_community" && (dbSubCommunities[community] || STATIC_SUB_COMMUNITIES[community]) && (
              <Select
                label="Sub-Community"
                value={subCaste || undefined}
                onValueChange={setSubCaste}
                placeholder="Select sub-community"
                options={(dbSubCommunities[community] || STATIC_SUB_COMMUNITIES[community] || []).map((sc) => ({ value: sc, label: sc }))}
              />
            )}
            <Select
              label={t.profile.maritalStatus}
              value={maritalStatus}
              onValueChange={setMaritalStatus}
              options={MARITAL_STATUS_OPTIONS.map((s) => ({ value: s.value, label: s.label }))}
            />
            {saved === "basic" && <p className="text-sm text-success font-medium">Basic info saved successfully!</p>}
            {saveError && <p className="text-sm text-error font-medium">{saveError}</p>}
            <Button variant="primary" size="md" disabled={saving} onClick={() => handleSave("basic")}>
              {saving ? "Saving..." : t.common.save}
            </Button>
          </Card>
        </TabsContent>

        {/* ─── Family ─── */}
        <TabsContent value="family">
          <Card variant="flat" padding="lg" className="space-y-5">
            <Input
              label={t.profile.religion}
              value={religion}
              onChange={(e) => setReligion(e.target.value)}
              placeholder="e.g., Hindu"
            />
            <Input
              label={t.profile.gothra}
              value={gothra}
              onChange={(e) => setGothra(e.target.value)}
              placeholder="e.g., Bharadwaj"
            />
            <Select
              label={t.profile.starNakshatra}
              value={star || undefined}
              onValueChange={setStar}
              placeholder="Select nakshatra"
              options={NAKSHATRAS.map((n) => ({ value: n, label: n }))}
            />
            <Select
              label={t.profile.rashi}
              value={rashi || undefined}
              onValueChange={setRashi}
              placeholder="Select rashi"
              options={RASHIS.map((r) => ({ value: r, label: r }))}
            />
            <Select
              label="Dosham"
              value={dosham || undefined}
              onValueChange={setDosham}
              placeholder="Select dosham status"
              options={DOSHAM_OPTIONS.map((d) => ({ value: d, label: d }))}
            />
            <Select
              label={t.profile.familyType}
              value={familyType || undefined}
              onValueChange={setFamilyType}
              placeholder="Select family type"
              options={FAMILY_TYPE_OPTIONS.map((f) => ({ value: f, label: f }))}
            />
            <Select
              label={t.profile.familyStatus}
              value={familyStatus || undefined}
              onValueChange={setFamilyStatus}
              placeholder="Select family status"
              options={FAMILY_STATUS_OPTIONS.map((s) => ({ value: s, label: s }))}
            />
            <Input
              label={t.profile.fatherOccupation}
              value={fatherOccupation}
              onChange={(e) => setFatherOccupation(e.target.value)}
              placeholder="e.g., Retired Government Officer"
            />
            <Input
              label={t.profile.motherOccupation}
              value={motherOccupation}
              onChange={(e) => setMotherOccupation(e.target.value)}
              placeholder="e.g., Homemaker"
            />
            {saved === "family" && <p className="text-sm text-success font-medium">Family details saved successfully!</p>}
            {saveError && <p className="text-sm text-error font-medium">{saveError}</p>}
            <Button variant="primary" size="md" disabled={saving} onClick={() => handleSave("family")}>
              {saving ? "Saving..." : t.common.save}
            </Button>
          </Card>
        </TabsContent>

        {/* ─── Career ─── */}
        <TabsContent value="career">
          <Card variant="flat" padding="lg" className="space-y-5">
            <Select
              label={t.profile.highestDegree}
              value={highestDegree || undefined}
              onValueChange={setHighestDegree}
              placeholder="Select degree"
              options={EDUCATION_LEVELS.flatMap((g) =>
                g.options.map((o) => ({ value: o, label: o, group: g.group }))
              )}
            />
            <Input
              label={t.profile.institution}
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              placeholder="e.g., Anna University"
            />
            <Select
              label={t.profile.occupationLabel}
              value={occupation || undefined}
              onValueChange={setOccupation}
              placeholder="Select occupation"
              options={OCCUPATIONS.map((o) => ({ value: o, label: o }))}
            />
            <Input
              label={t.profile.employer}
              value={employer}
              onChange={(e) => setEmployer(e.target.value)}
              placeholder="e.g., Infosys"
            />
            <Select
              label={t.profile.annualIncome}
              value={annualIncome || undefined}
              onValueChange={setAnnualIncome}
              placeholder="Select range"
              options={INCOME_RANGES.map((r) => ({ value: r, label: r }))}
            />

            {/* Location */}
            <div className="border-t border-neutral-200 pt-5">
              <p className="text-sm font-medium text-neutral-700 mb-3">Location</p>
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="State"
                  value={state || undefined}
                  onValueChange={(v) => { setState(v); setCity(""); }}
                  placeholder="Select state"
                  options={STATES.map((s) => ({ value: s, label: s }))}
                />
                <Select
                  label="City"
                  value={city || undefined}
                  onValueChange={setCity}
                  placeholder="Select city"
                  options={
                    state && STATE_CITIES[state]
                      ? STATE_CITIES[state].map((c) => ({ value: c, label: c }))
                      : []
                  }
                  disabled={!state}
                />
              </div>
            </div>

            {/* WhatsApp */}
            <div className="border-t border-neutral-200 pt-5">
              <Input
                label="WhatsApp Number"
                placeholder="+91 98765 43210"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
              />
              <p className="mt-1 text-xs text-neutral-500">Premium members can connect with you via WhatsApp. Leave blank to hide.</p>
            </div>
            {saved === "career" && <p className="text-sm text-success font-medium">Career details saved successfully!</p>}
            {saveError && <p className="text-sm text-error font-medium">{saveError}</p>}
            <Button variant="primary" size="md" disabled={saving} onClick={() => handleSave("career")}>
              {saving ? "Saving..." : t.common.save}
            </Button>
          </Card>
        </TabsContent>

        {/* ─── About ─── */}
        <TabsContent value="about">
          <Card variant="flat" padding="lg" className="space-y-5">
            <Textarea
              label={t.profile.aboutMe}
              value={aboutMe}
              onChange={(e) => setAboutMe(e.target.value)}
              placeholder="Tell potential matches about yourself, your values, and what makes you unique..."
              maxLength={500}
              charCount
            />
            <Textarea
              label={t.profile.lookingFor}
              value={lookingFor}
              onChange={(e) => setLookingFor(e.target.value)}
              placeholder="Describe the qualities you value in a life partner..."
              maxLength={300}
              charCount
            />
            <Select
              label={t.profile.diet}
              value={diet}
              onValueChange={setDiet}
              options={DIET_OPTIONS.map((d) => ({ value: d.value, label: d.label }))}
            />
            <Select
              label={t.profile.smoking}
              value={smoking}
              onValueChange={setSmoking}
              options={SMOKING_OPTIONS.map((s) => ({ value: s.value, label: s.label }))}
            />
            <Select
              label={t.profile.drinking}
              value={drinking}
              onValueChange={setDrinking}
              options={DRINKING_OPTIONS.map((d) => ({ value: d.value, label: d.label }))}
            />

            {/* Hobbies */}
            <div>
              <span className="text-sm font-medium text-neutral-600 mb-3 block">{t.profile.hobbies}</span>
              <div className="flex flex-wrap gap-2">
                {HOBBIES.map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => toggleHobby(h)}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-medium border transition-colors ${
                      selectedHobbies.has(h)
                        ? "bg-primary-50 border-primary-500 text-primary-700"
                        : "bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300"
                    }`}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>
            {saved === "about" && <p className="text-sm text-success font-medium">About section saved successfully!</p>}
            {saveError && <p className="text-sm text-error font-medium">{saveError}</p>}
            <Button variant="primary" size="md" disabled={saving} onClick={() => handleSave("about")}>
              {saving ? "Saving..." : t.common.save}
            </Button>
          </Card>
        </TabsContent>

        {/* ─── Partner Preferences ─── */}
        <TabsContent value="preferences">
          <div className="space-y-6">

            {/* ── Section 1: Basic ── */}
            <Card variant="flat" padding="lg" className="space-y-5">
              <h3 className="text-base font-semibold text-neutral-900 flex items-center gap-2">
                {t.shared.basicPreferences}
              </h3>

              {/* Age Range */}
              <div>
                <p className="text-sm font-medium text-neutral-600 mb-2">{t.profile.ageRangeLabel}</p>
                <div className="grid grid-cols-2 gap-4">
                  <Select
                    label={t.profile.ageMin}
                    value={prefAgeMin}
                    onValueChange={(v) => { setPrefAgeMin(v); if (Number(v) > Number(prefAgeMax)) setPrefAgeMax(v); }}
                    options={Array.from({ length: 43 }, (_, i) => ({ value: String(18 + i), label: `${18 + i} yrs` }))}
                  />
                  <Select
                    label={t.profile.ageMax}
                    value={prefAgeMax}
                    onValueChange={(v) => { setPrefAgeMax(v); if (Number(v) < Number(prefAgeMin)) setPrefAgeMin(v); }}
                    options={Array.from({ length: 43 }, (_, i) => ({ value: String(18 + i), label: `${18 + i} yrs` }))}
                  />
                </div>
              </div>

              {/* Height Range */}
              <div>
                <p className="text-sm font-medium text-neutral-600 mb-2">{t.profile.heightRange}</p>
                <div className="grid grid-cols-2 gap-4">
                  <Select
                    label="Min Height"
                    value={prefHeightMin || undefined}
                    onValueChange={setPrefHeightMin}
                    placeholder="Any"
                    options={HEIGHT_OPTIONS.map((h) => ({ value: h, label: h }))}
                  />
                  <Select
                    label="Max Height"
                    value={prefHeightMax || undefined}
                    onValueChange={setPrefHeightMax}
                    placeholder="Any"
                    options={HEIGHT_OPTIONS.map((h) => ({ value: h, label: h }))}
                  />
                </div>
              </div>

              {/* Marital Status */}
              <div>
                <p className="text-sm font-medium text-neutral-600 mb-2">{t.profile.maritalStatus}</p>
                <div className="space-y-2">
                  {MARITAL_STATUS_OPTIONS.map((s) => (
                    <Checkbox
                      key={s.value}
                      label={s.label}
                      checked={prefMaritalStatus.has(s.value)}
                      onCheckedChange={() => togglePrefMarital(s.value)}
                    />
                  ))}
                </div>
              </div>

              {/* Children Acceptable */}
              {(prefMaritalStatus.has("divorced") || prefMaritalStatus.has("widowed")) && (
                <Select
                  label="Accept Partner with Children?"
                  value={prefChildrenOk}
                  onValueChange={setPrefChildrenOk}
                  options={CHILDREN_ACCEPTABLE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                />
              )}

              {/* Complexion */}
              <Select
                label="Complexion Preference"
                value={prefComplexion}
                onValueChange={setPrefComplexion}
                options={COMPLEXION_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
              />

              {/* Physical Disability */}
              <Select
                label="Physical Disability"
                value={prefDisability}
                onValueChange={setPrefDisability}
                options={PHYSICAL_DISABILITY_PREF_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
              />
            </Card>

            {/* ── Section 2: Community & Language ── */}
            <Card variant="flat" padding="lg" className="space-y-5">
              <h3 className="text-base font-semibold text-neutral-900">{t.shared.communityAndLanguage}</h3>

              {/* Mother Tongue */}
              <div>
                <p className="text-sm font-medium text-neutral-600 mb-2">Mother Tongue</p>
                <div className="flex flex-wrap gap-2">
                  {MOTHER_TONGUES.map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => togglePrefMotherTongue(l)}
                      className={`rounded-full px-3.5 py-1.5 text-xs font-medium border transition-colors ${
                        prefMotherTongues.has(l)
                          ? "bg-primary-50 border-primary-500 text-primary-700"
                          : "bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300"
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
                {prefMotherTongues.size > 0 && (
                  <p className="mt-1.5 text-xs text-neutral-500">{prefMotherTongues.size} selected</p>
                )}
              </div>

              {/* Preferred Communities */}
              <div>
                <p className="text-sm font-medium text-neutral-600 mb-2">{t.profile.communities}</p>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto rounded-lg border border-neutral-200 p-3">
                  {(dbCommunities.length > 0 ? dbCommunities : [...STATIC_COMMUNITIES]).map((c) => (
                    <Checkbox
                      key={c}
                      label={c}
                      checked={prefCommunities.has(c)}
                      onCheckedChange={() => togglePrefCommunity(c)}
                    />
                  ))}
                </div>
                {prefCommunities.size > 0 && (
                  <p className="mt-1.5 text-xs text-neutral-500">{prefCommunities.size} selected</p>
                )}
              </div>

              {/* Gothra to avoid */}
              <div>
                <Input
                  label="Gothra to Avoid (Same Gothra)"
                  value={prefGothra}
                  onChange={(e) => setPrefGothra(e.target.value)}
                  placeholder="e.g., Bharadwaj"
                />
                <p className="mt-1 text-xs text-neutral-500">Traditionally, marriages within the same gothra are avoided.</p>
              </div>
            </Card>

            {/* ── Section 3: Education & Career ── */}
            <Card variant="flat" padding="lg" className="space-y-5">
              <h3 className="text-base font-semibold text-neutral-900">{t.shared.educationAndCareer}</h3>

              <Select
                label={t.profile.educationLabel}
                value={prefEducation || undefined}
                onValueChange={setPrefEducation}
                placeholder="Any education"
                options={EDUCATION_LEVELS.flatMap((g) =>
                  g.options.map((o) => ({ value: o, label: o, group: g.group }))
                )}
              />

              <Select
                label={t.profile.occupationLabel}
                value={prefOccupation || undefined}
                onValueChange={setPrefOccupation}
                placeholder="Any occupation"
                options={OCCUPATIONS.map((o) => ({ value: o, label: o }))}
              />

              <Select
                label="Employment Type"
                value={prefEmploymentType}
                onValueChange={setPrefEmploymentType}
                options={EMPLOYMENT_TYPE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
              />

              <Select
                label="Minimum Annual Income"
                value={prefIncomeMin || undefined}
                onValueChange={setPrefIncomeMin}
                placeholder="No minimum"
                options={INCOME_RANGES.map((r) => ({ value: r, label: r }))}
              />
            </Card>

            {/* ── Section 4: Location & Residency ── */}
            <Card variant="flat" padding="lg" className="space-y-5">
              <h3 className="text-base font-semibold text-neutral-900">{t.shared.locationAndResidency}</h3>

              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="State"
                  value={prefState || undefined}
                  onValueChange={(v) => { setPrefState(v); setPrefCity(""); }}
                  placeholder="Any state"
                  options={STATES.map((s) => ({ value: s, label: s }))}
                />
                <Select
                  label="City"
                  value={prefCity || undefined}
                  onValueChange={setPrefCity}
                  placeholder={prefState ? "Select city" : "Select state first"}
                  options={
                    prefState && STATE_CITIES[prefState]
                      ? STATE_CITIES[prefState].map((c) => ({ value: c, label: c }))
                      : []
                  }
                  disabled={!prefState}
                />
              </div>

              <Select
                label="Citizenship / Residency"
                value={prefCitizenship}
                onValueChange={setPrefCitizenship}
                options={CITIZENSHIP_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
              />
            </Card>

            {/* ── Section 5: Horoscope ── */}
            <Card variant="flat" padding="lg" className="space-y-5">
              <h3 className="text-base font-semibold text-neutral-900">{t.shared.horoscopeMatching}</h3>

              <Select
                label={t.profile.starCompatibility}
                value={prefStarCompat}
                onValueChange={setPrefStarCompat}
                options={STAR_COMPATIBILITY_OPTIONS.map((s) => ({ value: s.value, label: s.label }))}
              />

              <Select
                label={t.profile.dosham}
                value={prefDosham}
                onValueChange={setPrefDosham}
                options={DOSHAM_PREF_OPTIONS.map((d) => ({ value: d.value, label: d.label }))}
              />
            </Card>

            {/* ── Section 6: Lifestyle ── */}
            <Card variant="flat" padding="lg" className="space-y-5">
              <h3 className="text-base font-semibold text-neutral-900">{t.shared.lifestylePreferences}</h3>

              <Select
                label={t.profile.diet}
                value={prefDiet}
                onValueChange={setPrefDiet}
                options={DIET_PREF_OPTIONS.map((d) => ({ value: d.value, label: d.label }))}
              />

              <Select
                label="Smoking"
                value={prefSmokingOk}
                onValueChange={setPrefSmokingOk}
                options={SMOKING_PREF_OPTIONS.map((s) => ({ value: s.value, label: s.label }))}
              />

              <Select
                label="Drinking"
                value={prefDrinkingOk}
                onValueChange={setPrefDrinkingOk}
                options={DRINKING_PREF_OPTIONS.map((d) => ({ value: d.value, label: d.label }))}
              />
            </Card>

            {/* ── Section 7: Family Background ── */}
            <Card variant="flat" padding="lg" className="space-y-5">
              <h3 className="text-base font-semibold text-neutral-900">{t.shared.familyBackground}</h3>

              <Select
                label="Family Type"
                value={prefFamilyType}
                onValueChange={setPrefFamilyType}
                options={FAMILY_TYPE_PREF_OPTIONS.map((f) => ({ value: f.value, label: f.label }))}
              />

              <div>
                <p className="text-sm font-medium text-neutral-600 mb-2">Family Status</p>
                <div className="space-y-2">
                  {FAMILY_STATUS_OPTIONS.map((s) => (
                    <Checkbox
                      key={s}
                      label={s}
                      checked={prefFamilyStatus.has(s)}
                      onCheckedChange={() => togglePrefFamilyStatus(s)}
                    />
                  ))}
                </div>
              </div>
            </Card>

            {/* Save */}
            <Card variant="flat" padding="lg">
              {saved === "preferences" && <p className="text-sm text-success font-medium mb-3">Preferences saved successfully!</p>}
              {saveError && <p className="text-sm text-error font-medium mb-3">{saveError}</p>}
              <Button variant="primary" size="lg" fullWidth disabled={saving} onClick={() => handleSave("preferences")}>
                {saving ? "Saving..." : t.profile.savePreferences}
              </Button>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
