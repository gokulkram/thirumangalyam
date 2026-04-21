"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Shield,
  CheckCircle,
  Users,
  Heart,
  UserPlus,
  Search,
  MessageSquare,
  Sparkles
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";

export default function LandingPage() {
  const { t } = useTranslation();

  const TRUST_STATS = [
    { icon: Shield, label: t.trustStats.photosVerified, value: "100%" },
    { icon: CheckCircle, label: t.trustStats.idVerified, value: t.trustStats.aadhaar },
    { icon: Users, label: t.trustStats.activeProfiles, value: "50,000+" },
    { icon: Heart, label: t.trustStats.successMarriages, value: "1,200+" }
  ];

  return (
    <>
      {/* HERO */}
      <section className="relative min-h-[720px] flex items-center text-white overflow-hidden">

        {/* Background */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/hero-bg.jpg')" }}
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#4a0000]/80 via-[#7a0000]/60 to-[#000]/30" />

        {/* Content */}
        <div className="relative z-10 max-w-[1280px] mx-auto px-4 py-20 grid lg:grid-cols-12 gap-10 items-center">

          {/* LEFT */}
          <div className="lg:col-span-7">

            <span className="bg-[#b40000] px-4 py-1 rounded-full text-sm shadow">
              {t.landing.trustedBy}
            </span>

            <h1 className="mt-6 text-4xl lg:text-6xl font-bold leading-tight">
              {t.landing.heroTitle}
            </h1>

            <p className="mt-4 text-lg text-white/90 max-w-lg">
              {t.landing.heroSubtitle}
            </p>

            <div className="flex gap-4 mt-8 flex-wrap">

              <Link
                href="/register"
                className="bg-[#b40000] hover:bg-[#8f0000] px-7 py-3 rounded-full font-semibold shadow-lg"
              >
                {t.common.registerFree}
              </Link>

              <Link
                href="/search"
                className="bg-white text-black px-7 py-3 rounded-full font-semibold shadow-lg"
              >
                {t.landing.browseProfiles}
              </Link>

            </div>

            {/* TRUST STATS */}
            <div className="flex flex-wrap gap-6 mt-10">

              {TRUST_STATS.map((stat) => (
                <div
                  key={stat.label}
                  className="flex items-center gap-3 bg-white/10 backdrop-blur px-4 py-3 rounded-lg"
                >

                  <stat.icon className="w-5 h-5 text-green-400" />

                  <div>
                    <p className="text-sm font-bold">{stat.value}</p>
                    <p className="text-xs text-white/70">{stat.label}</p>
                  </div>

                </div>
              ))}

            </div>

          </div>

          {/* RIGHT FORM */}
          <div className="hidden lg:flex lg:col-span-5 justify-end">

            <div className="w-[420px] bg-white rounded-2xl shadow-2xl overflow-hidden">

              {/* HEADER */}
              <div className="bg-[#b40000] py-5 text-center text-white font-bold text-xl">
                {t.landing.createProfile}
              </div>

              {/* FORM */}
              <div className="p-6 space-y-5 bg-[#fafafa]">

                <h3 className="text-center text-lg font-semibold text-gray-800">
                  {t.landing.findMatch}
                </h3>

                {/* Profile For */}
                <select className="w-full bg-white border border-gray-300 text-gray-700 rounded-xl px-4 py-3 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-300">
                  <option value="">{t.landing.profileFor}</option>
                  <option>{t.landing.myself}</option>
                  <option>{t.landing.son}</option>
                  <option>{t.landing.daughter}</option>
                  <option>{t.landing.brother}</option>
                  <option>{t.landing.sister}</option>
                </select>

                {/* Name */}
                <input
                  type="text"
                  placeholder={t.landing.enterName}
                  className="w-full bg-white border border-gray-300 text-gray-700 placeholder-gray-400 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
                />

                {/* Mobile */}
                <div className="flex gap-3">

                  <select className="bg-white border border-gray-300 text-gray-700 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-300">
                    <option>+91</option>
                  </select>

                  <input
                    type="tel"
                    placeholder={t.landing.mobileNumber}
                    className="flex-1 bg-white border border-gray-300 text-gray-700 placeholder-gray-400 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
                  />

                </div>

                <p className="text-xs text-gray-500">
                  {t.landing.otpNote}
                </p>

                {/* Button */}
                <button className="w-full bg-[#b40000] hover:bg-[#8f0000] text-white py-3 rounded-full font-semibold shadow-md transition">
                  {t.common.registerFree} →
                </button>

                <p className="text-xs text-center text-gray-500">
                  {t.landing.termsNote}
                </p>

              </div>

            </div>

          </div>

        </div>

      </section>
      <section className="py-20 bg-gradient-to-r from-[#fff5f5] to-[#ffe6e6]">

        <div className="max-w-6xl mx-auto px-4">

          {/* Title */}
          <div className="flex items-center justify-center gap-6 mb-10">

            <div className="w-16 h-[3px] bg-[#b40000]"></div>

            <h2 className="text-[#b40000] text-2xl font-semibold text-center">
              {t.landing.searchTitle}
            </h2>

            <div className="w-16 h-[3px] bg-[#b40000]"></div>

          </div>


          {/* Search Box */}
          <div className="bg-white rounded-2xl shadow-xl p-8">

            <div className="grid md:grid-cols-5 gap-6 items-end">

              {/* Looking For */}
              <div>
                <label className="text-gray-700 text-sm font-medium">
                  {t.landing.lookingFor}
                </label>

                <select className="w-full mt-2 border border-gray-300 bg-white text-gray-800 rounded-lg px-4 py-3 focus:ring-2 focus:ring-red-300">
                  <option>{t.landing.bride}</option>
                  <option>{t.landing.groom}</option>
                </select>
              </div>

              {/* Age */}
              <div>
                <label className="text-gray-700 text-sm font-medium">
                  {t.landing.age}
                </label>

                <select className="w-full mt-2 border border-gray-300 bg-white text-gray-800 rounded-lg px-4 py-3 focus:ring-2 focus:ring-red-300">
                  <option>18 - 25</option>
                  <option>25 - 30</option>
                  <option>30 - 35</option>
                </select>
              </div>

              {/* Profession */}
              <div>
                <label className="text-gray-700 text-sm font-medium">
                  {t.landing.profession}
                </label>

                <select className="w-full mt-2 border border-gray-300 bg-white text-gray-800 rounded-lg px-4 py-3 focus:ring-2 focus:ring-red-300">
                  <option>{t.landing.itProfessional}</option>
                  <option>{t.landing.business}</option>
                  <option>{t.landing.governmentJob}</option>
                </select>
              </div>

              {/* Location */}
              <div>
                <label className="text-gray-700 text-sm font-medium">
                  {t.landing.location}
                </label>

                <select className="w-full mt-2 border border-gray-300 bg-white text-gray-800 rounded-lg px-4 py-3 focus:ring-2 focus:ring-red-300">
                  <option>Coimbatore</option>
                  <option>Erode</option>
                  <option>Salem</option>
                </select>
              </div>

              {/* Button */}
              <div>
                <Link
                  href="/search"
                  className="block w-full bg-[#b40000] hover:bg-[#8f0000] text-white font-semibold py-3 rounded-lg shadow-md text-center"
                >
                  {t.common.search}
                </Link>
              </div>

            </div>

          </div>

        </div>

      </section>

      {/* HOW IT WORKS */}

      <section id="how-it-works" className="py-20 bg-[#f8fafc]">

        <div className="max-w-6xl mx-auto px-4 text-center">

          {/* Title */}
          <h2 className="text-3xl font-bold text-gray-900">
            {t.landing.howItWorks}
          </h2>

          <p className="text-gray-500 mt-2">
            {t.landing.howItWorksSubtitle}
          </p>


          {/* Steps */}
          <div className="relative mt-16">

            {/* Line */}
            <div className="hidden md:block absolute top-8 left-0 right-0 h-[2px] bg-gray-200"></div>

            <div className="grid md:grid-cols-4 gap-10 relative">

              {/* Step 1 */}
              <div className="text-center">

                <div className="w-16 h-16 mx-auto rounded-full bg-red-100 flex items-center justify-center text-red-600 text-xl font-bold shadow">
                  1
                </div>

                <h3 className="mt-6 text-lg font-semibold text-gray-800">
                  {t.landing.step1Title}
                </h3>

                <p className="text-gray-500 text-sm mt-2">
                  {t.landing.step1Desc}
                </p>

              </div>


              {/* Step 2 */}
              <div className="text-center">

                <div className="w-16 h-16 mx-auto rounded-full bg-red-100 flex items-center justify-center text-red-600 text-xl font-bold shadow">
                  2
                </div>

                <h3 className="mt-6 text-lg font-semibold text-gray-800">
                  {t.landing.step2Title}
                </h3>

                <p className="text-gray-500 text-sm mt-2">
                  {t.landing.step2Desc}
                </p>

              </div>


              {/* Step 3 */}
              <div className="text-center">

                <div className="w-16 h-16 mx-auto rounded-full bg-red-100 flex items-center justify-center text-red-600 text-xl font-bold shadow">
                  3
                </div>

                <h3 className="mt-6 text-lg font-semibold text-gray-800">
                  {t.landing.step3Title}
                </h3>

                <p className="text-gray-500 text-sm mt-2">
                  {t.landing.step3Desc}
                </p>

              </div>


              {/* Step 4 */}
              <div className="text-center">

                <div className="w-16 h-16 mx-auto rounded-full bg-red-100 flex items-center justify-center text-red-600 text-xl font-bold shadow">
                  4
                </div>

                <h3 className="mt-6 text-lg font-semibold text-gray-800">
                  {t.landing.step4Title}
                </h3>

                <p className="text-gray-500 text-sm mt-2">
                  {t.landing.step4Desc}
                </p>

              </div>

            </div>

          </div>

        </div>

      </section>
      {/* BRIDE & GROOM PROFILES */}

      <section className="py-16 bg-gradient-to-r from-[#fff5f5] to-[#ffe6e6]">

        <div className="max-w-[1280px] mx-auto px-4">

          {/* Title */}
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900">
              {t.landing.findGroom}
            </h2>
          </div>


          {/* Cards */}
          <div className="grid md:grid-cols-4 gap-6">

            {[
              {
                img: "/profiles/groom.jpg",
                id: "TM10051",
                name: "T. Prasanth",
                age: "24",
                edu: "BCA",
                occupation: "Software Professional",
                location: "Chennai",
                community: "Brahmin - Iyer",
              },
              {
                img: "/profiles/groom2.jpg",
                id: "TM10052",
                name: "S. Karthik",
                age: "28",
                edu: "B.E (MECH)",
                occupation: "Engineer",
                location: "Coimbatore",
                community: "Gounder",
              },
              {
                img: "/profiles/groom3.jpg",
                id: "TM10053",
                name: "M. Manikandan",
                age: "27",
                edu: "MBA/PGDM",
                occupation: "Business/Entrepreneur",
                location: "Bangalore",
                community: "Mudaliar",
              },
              {
                img: "/profiles/groom4.jpg",
                id: "TM10054",
                name: "R. Sibi",
                age: "30",
                edu: "B.Com (CA)",
                occupation: "Chartered Accountant",
                location: "Madurai",
                community: "Chettiar",
              }
            ].map((profile, i) => (

              <div
                key={i}
                className="bg-white border rounded-md overflow-hidden shadow-sm hover:shadow-md transition"
              >

                {/* Image */}
                <div className="relative h-[300px] w-full">

                  <Image
                    src={profile.img}
                    alt={profile.name}
                    fill
                    className="object-cover"
                  />

                </div>


                {/* Details */}
                <div className="p-4 text-xs text-gray-700">

                  <div className="grid grid-cols-2 gap-y-1">

                    <span className="font-semibold">{t.landing.profileId}</span>
                    <span>{profile.id}</span>

                    <span className="font-semibold">{t.landing.name}</span>
                    <span>{profile.name}</span>

                    <span className="font-semibold">{t.landing.age}</span>
                    <span>{profile.age}</span>

                    <span className="font-semibold">{t.landing.education}</span>
                    <span>{profile.edu}</span>

                    <span className="font-semibold">{t.landing.occupation}</span>
                    <span>{profile.occupation}</span>

                    <span className="font-semibold">{t.landing.location}</span>
                    <span>{profile.location}</span>

                    <span className="font-semibold">{t.landing.community}</span>
                    <span>{profile.community}</span>

                  </div>

                  {/* Button */}
                  <Link
                    href={`/profile/${profile.id}`}
                    className="block mt-4 text-center border border-red-500 text-red-500 py-2 rounded hover:bg-red-500 hover:text-white transition"
                  >
                    {t.landing.viewFullProfile}
                  </Link>

                </div>

              </div>

            ))}

          </div>


          {/* View All */}
          <div className="text-center mt-8">

            <Link
              href="/search"
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded shadow"
            >
              {t.common.viewAll}
            </Link>

          </div>

        </div>

      </section>
      <section className="py-16 bg-gradient-to-r from-[#fff5f5] to-[#ffe6e6]">

        <div className="max-w-[1280px] mx-auto px-4">

          {/* Title */}
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900">
              {t.landing.findBride}
            </h2>
          </div>

          {/* Cards */}
          <div className="grid md:grid-cols-4 gap-6">

            {[
              {
                img: "/profiles/bride1.jpg",
                id: "TM10001",
                name: "Anjali Raghavan",
                age: "24",
                edu: "BCA",
                occupation: "Software Engineer",
                location: "Chennai",
                community: "Brahmin - Iyer",
              },
              {
                img: "/profiles/bride2.jpg",
                id: "TM10002",
                name: "Divya Krishnamurthy",
                age: "26",
                edu: "MBBS",
                occupation: "Doctor",
                location: "Bangalore",
                community: "Iyengar",
              },
              {
                img: "/profiles/bride.jpg",
                id: "TM10003",
                name: "Meena Sundaramoorthy",
                age: "25",
                edu: "M.Sc.",
                occupation: "Teacher/Professor",
                location: "Coimbatore",
                community: "Gounder",
              },
              {
                img: "/profiles/bride3.jpg",
                id: "TM10004",
                name: "Kavitha Pillai",
                age: "27",
                edu: "B.Com (CA)",
                occupation: "Chartered Accountant",
                location: "Hyderabad",
                community: "Pillai",
              }
            ].map((profile, i) => (

              <div
                key={i}
                className="bg-white border rounded-md overflow-hidden shadow-sm hover:shadow-md transition"
              >

                {/* Image */}
                <div className="relative h-[300px] w-full">
                  <Image
                    src={profile.img}
                    alt={profile.name}
                    fill
                    className="object-cover"
                  />
                </div>

                {/* Details */}
                <div className="p-4 text-xs text-gray-700">

                  <div className="grid grid-cols-2 gap-y-1">

                    <span className="font-semibold">{t.landing.profileId}</span>
                    <span>{profile.id}</span>

                    <span className="font-semibold">{t.landing.name}</span>
                    <span>{profile.name}</span>

                    <span className="font-semibold">{t.landing.age}</span>
                    <span>{profile.age}</span>

                    <span className="font-semibold">{t.landing.education}</span>
                    <span>{profile.edu}</span>

                    <span className="font-semibold">{t.landing.occupation}</span>
                    <span>{profile.occupation}</span>

                    <span className="font-semibold">{t.landing.location}</span>
                    <span>{profile.location}</span>

                    <span className="font-semibold">{t.landing.community}</span>
                    <span>{profile.community}</span>

                  </div>

                  <Link
                    href={`/profile/${profile.id}`}
                    className="block mt-4 text-center border border-red-500 text-red-500 py-2 rounded hover:bg-red-500 hover:text-white transition"
                  >
                    {t.landing.viewFullProfile}
                  </Link>

                </div>

              </div>

            ))}

          </div>

        </div>
        <div className="text-center mt-8">

          <Link
            href="/search"
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded shadow"
          >
            {t.common.viewAll}
          </Link>

        </div>
      </section>
      {/* SUCCESS STORIES */}

      <section id="success-stories" className="bg-white py-16">

        <div className="max-w-[1280px] mx-auto px-4">

          <div className="text-center">

            <h2 className="text-3xl font-bold text-gray-800">
              {t.landing.successStories}
            </h2>

            <p className="text-gray-500 mt-2">
              {t.landing.successSubtitle}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mt-10">

            {[
              {
                img: "/couple1.jpg",
                name: "Arun & Meena",
                location: "Chennai",
                year: "2025",
                feedback: "We met through Thirumangalyam and our horoscopes matched perfectly — 9 out of 10 poruthams! Our families connected instantly and everything fell into place beautifully."
              },
              {
                img: "/couple2.jpg",
                name: "Karthik & Divya",
                location: "Bangalore",
                year: "2025",
                feedback: "My parents found Karthik's profile here and were impressed by the verified details. The star matching feature gave our families great confidence. We are happily married now!"
              },
              {
                img: "/couple3.jpg",
                name: "Vignesh & Harini",
                location: "Coimbatore",
                year: "2024",
                feedback: "The platform made everything so simple — from profile browsing to interest expression to family discussions. Found my perfect partner within 3 months of registering!"
              }
            ].map((item, i) => (

              <div
                key={i}
                className="border rounded-xl p-6 text-center shadow-sm hover:shadow-md transition"
              >

                <div className="w-20 h-20 mx-auto relative rounded-full overflow-hidden">
                  <Image
                    src={item.img}
                    alt={item.name}
                    fill
                    className="object-cover"
                  />
                </div>

                <p className="mt-4 font-semibold text-gray-800">
                  {item.name}
                </p>

                <p className="text-sm text-gray-500">
                  {t.landing.married} {item.year} &middot; {item.location}
                </p>

                <p className="text-sm text-gray-600 mt-3 italic">
                  &quot;{item.feedback}&quot;
                </p>

              </div>
            ))}

          </div>

        </div>

      </section>
    </>
  );
}
