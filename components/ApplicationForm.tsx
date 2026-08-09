'use client';

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import dropdownData from '@/src/data/dropdowns.json';

export default function ApplicationForm() {
    // Basic Details State
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [indexNumber, setIndexNumber] = useState('');
    const [email, setEmail] = useState('');
    const [whatsappNumber, setWhatsappNumber] = useState('');
    const [dob, setDob] = useState('');
    const [address, setAddress] = useState('');
    const [cvFile, setCvFile] = useState<File | null>(null);
    const [portfolioUrl, setPortfolioUrl] = useState('');
    const [interests, setInterests] = useState('');
    const [clubs, setClubs] = useState('');

    // Loading & Error State Mapping
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [serverError, setServerError] = useState<string | null>(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    // Academic & Pillar Selection State
    const [batch, setBatch] = useState('');
    const [faculty, setFaculty] = useState('');
    const [department, setDepartment] = useState('');
    const [selectedPillars, setSelectedPillars] = useState<string[]>([]);

    const handlePillarClick = (pillar: string) => {
        if (selectedPillars.includes(pillar)) {
            setSelectedPillars(selectedPillars.filter((p) => p !== pillar));
        } else {
            if (selectedPillars.length < 3) {
                setSelectedPillars([...selectedPillars, pillar]);
            }
        }
        setTouched(prev => ({ ...prev, pillars: true }));
    };

    const handleClear = () => {
        setFirstName('');
        setLastName('');
        setIndexNumber('');
        setEmail('');
        setWhatsappNumber('');
        setDob('');
        setAddress('');
        setCvFile(null);
        setPortfolioUrl('');
        setInterests('');
        setClubs('');
        setBatch('');
        setFaculty('');
        setDepartment('');
        setSelectedPillars([]);
        setTouched({});
        setServerError(null);
    };

    // Live validation check for all required fields
    const errors = useMemo(() => {
        const errs: Record<string, string> = {};

        if (!batch) errs.batch = "Please select a batch.";
        if (!firstName.trim()) errs.firstName = "First name is required.";
        if (!lastName.trim()) errs.lastName = "Last name is required.";
        if (!indexNumber.trim()) errs.indexNumber = "Index number is required.";
        if (!faculty) errs.faculty = "Please select a faculty.";
        if (!department.trim()) errs.department = "Department is required.";
        if (!email.trim() || !email.includes('@')) errs.email = "Please enter a valid email address.";
        
        const whatsappRegex = /^(0|\+94)\d{9}$/;
        if (!whatsappRegex.test(whatsappNumber)) {
            errs.whatsappNumber = "Must be a valid 10-digit number or +94 format (e.g., 0712345678 or +94712345678).";
        }

        if (!dob.trim()) errs.dob = "Date of birth is required.";
        if (!address.trim()) errs.address = "Address is required.";
        if (!cvFile) errs.cv = "CV / Resume file is required.";
        if (selectedPillars.length === 0) {
            errs.pillars = "Please select at least 1 pillar (max 3).";
        }

        return errs;
    }, [batch, firstName, lastName, indexNumber, faculty, department, email, whatsappNumber, dob, address, cvFile, selectedPillars]);

    const isFormValid = Object.keys(errors).length === 0;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setTouched({
            firstName: true,
            lastName: true,
            indexNumber: true,
            email: true,
            whatsappNumber: true,
            dob: true,
            address: true,
            faculty: true,
            department: true,
            batch: true,
            pillars: true,
            cv: true,
        });

        if (!isFormValid) return;

        setServerError(null);
        setIsSubmitting(true);

        const payloadData = {
            batch,
            firstName,
            lastName,
            indexNumber,
            faculty,
            department,
            university: "University of Moratuwa",
            email,
            whatsappNumber,
            dob,
            address,
            portfolioUrl: portfolioUrl || undefined,
            pillars: selectedPillars,
            interests: interests || undefined,
            clubs: clubs || undefined,
        };

        const formData = new FormData();
        formData.append('cv', cvFile!);
        formData.append('turnstileToken', 'dummy-turnstile-token');
        formData.append('data', JSON.stringify(payloadData));

        try {
            const response = await fetch('/api/apply', {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();

            if (!response.ok) {
                if (result.error && typeof result.error === 'string') {
                    throw new Error(result.error);
                } else {
                    throw new Error("Failed to submit application. Please check your inputs.");
                }
            }

            handleClear();
            setShowSuccessModal(true);
        } catch (error: any) {
            console.error("Submission error:", error);
            setServerError(error.message || "An error occurred while submitting the form. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <form onSubmit={handleSubmit} className="space-y-8">
                
                {/* Global Server Error banner */}
                {serverError && (
                    <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium">
                        {serverError}
                    </div>
                )}

                {/* SECTION 1: Personal & Contact Information */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-zinc-900">Personal Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                        
                        <div className="space-y-2">
                            <Label htmlFor="firstName" className="text-zinc-900 font-medium">
                                First Name <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="firstName"
                                type="text"
                                disabled={isSubmitting}
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                onBlur={() => setTouched(prev => ({ ...prev, firstName: true }))}
                                placeholder="e.g. Nimal"
                                className={`bg-white h-10 px-3.5 text-sm ${touched.firstName && errors.firstName ? 'border-red-500 ring-1 ring-red-500 focus-visible:ring-red-500' : ''}`}
                            />
                            {touched.firstName && errors.firstName && <p className="text-xs text-red-500 mt-1">{errors.firstName}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="lastName" className="text-zinc-900 font-medium">
                                Last Name <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="lastName"
                                type="text"
                                disabled={isSubmitting}
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                onBlur={() => setTouched(prev => ({ ...prev, lastName: true }))}
                                placeholder="e.g. Perera"
                                className={`bg-white h-10 px-3.5 text-sm ${touched.lastName && errors.lastName ? 'border-red-500 ring-1 ring-red-500 focus-visible:ring-red-500' : ''}`}
                            />
                            {touched.lastName && errors.lastName && <p className="text-xs text-red-500 mt-1">{errors.lastName}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="indexNumber" className="text-zinc-900 font-medium">
                                Index Number <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="indexNumber"
                                type="text"
                                disabled={isSubmitting}
                                value={indexNumber}
                                onChange={(e) => setIndexNumber(e.target.value)}
                                onBlur={() => setTouched(prev => ({ ...prev, indexNumber: true }))}
                                placeholder="e.g. 240000X"
                                className={`bg-white h-10 px-3.5 text-sm ${touched.indexNumber && errors.indexNumber ? 'border-red-500 ring-1 ring-red-500 focus-visible:ring-red-500' : ''}`}
                            />
                            {touched.indexNumber && errors.indexNumber && <p className="text-xs text-red-500 mt-1">{errors.indexNumber}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-zinc-900 font-medium">
                                Email <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                disabled={isSubmitting}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                onBlur={() => setTouched(prev => ({ ...prev, email: true }))}
                                placeholder="e.g. nimal.perera@gmail.com"
                                className={`bg-white h-10 px-3.5 text-sm ${touched.email && errors.email ? 'border-red-500 ring-1 ring-red-500 focus-visible:ring-red-500' : ''}`}
                            />
                            {touched.email && errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="whatsappNumber" className="text-zinc-900 font-medium">
                                WhatsApp Mobile <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="whatsappNumber"
                                type="tel"
                                disabled={isSubmitting}
                                value={whatsappNumber}
                                onChange={(e) => setWhatsappNumber(e.target.value)}
                                onBlur={() => setTouched(prev => ({ ...prev, whatsappNumber: true }))}
                                placeholder="e.g. 0712345678 or +94712345678"
                                className={`bg-white h-10 px-3.5 text-sm ${touched.whatsappNumber && errors.whatsappNumber ? 'border-red-500 ring-1 ring-red-500 focus-visible:ring-red-500' : ''}`}
                            />
                            {touched.whatsappNumber && errors.whatsappNumber && <p className="text-xs text-red-500 mt-1">{errors.whatsappNumber}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="dob" className="text-zinc-900 font-medium">
                                Date of Birth <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="dob"
                                type="date"
                                disabled={isSubmitting}
                                value={dob}
                                onChange={(e) => setDob(e.target.value)}
                                onBlur={() => setTouched(prev => ({ ...prev, dob: true }))}
                                className={`bg-white h-10 px-3.5 text-sm block w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer ${touched.dob && errors.dob ? 'border-red-500 ring-1 ring-red-500 focus-visible:ring-red-500' : ''}`}
                            />
                            {touched.dob && errors.dob && <p className="text-xs text-red-500 mt-1">{errors.dob}</p>}
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="address" className="text-zinc-900 font-medium">
                                Address <span className="text-red-500">*</span>
                            </Label>
                            <textarea
                                id="address"
                                disabled={isSubmitting}
                                rows={2}
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                onBlur={() => setTouched(prev => ({ ...prev, address: true }))}
                                placeholder="Enter your residential address here..."
                                className={`w-full bg-white rounded-xl border px-3.5 py-2 text-sm focus:outline-none focus:ring-1 resize-none ${touched.address && errors.address ? 'border-red-500 ring-1 ring-red-500 focus:ring-red-500' : 'border-zinc-200 focus:ring-zinc-900'}`}
                            />
                            {touched.address && errors.address && <p className="text-xs text-red-500 mt-1">{errors.address}</p>}
                        </div>

                    </div>
                </div>

                {/* SECTION 2: Academic & Preferences */}
                <div className="space-y-4 pt-4 border-t border-zinc-200">
                    <h3 className="text-lg font-semibold text-zinc-900">Academic & Preferences</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6 items-start">
                        
                        {/* University - Readonly Text Field */}
                        <div className="space-y-2">
                            <Label htmlFor="university" className="text-zinc-900 font-medium">
                                University <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="university"
                                value="University of Moratuwa"
                                readOnly
                                className="bg-zinc-100 text-zinc-500 cursor-not-allowed focus-visible:ring-0 h-10 px-3.5 text-sm" 
                            />
                        </div>

                        {/* Faculty */}
                        <div className="space-y-2">
                            <Label htmlFor="faculty" className="text-zinc-900 font-medium">
                                Faculty <span className="text-red-500">*</span>
                            </Label>
                            <Select 
                                value={faculty} 
                                onValueChange={(val) => { setFaculty(val); setTouched(prev => ({ ...prev, faculty: true })); }} 
                                disabled={isSubmitting}
                            >
                                <SelectTrigger className={`bg-white h-10 px-3.5 text-sm w-full [&>span]:line-clamp-none ${touched.faculty && errors.faculty ? 'border-red-500 ring-1 ring-red-500 focus:ring-red-500' : ''}`}>
                                    <SelectValue placeholder="Select faculty" />
                                </SelectTrigger>
                                <SelectContent>
                                    {dropdownData.faculties.map((facultyOption) => (
                                        <SelectItem key={facultyOption} value={facultyOption}>
                                            {facultyOption}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {touched.faculty && errors.faculty && <p className="text-xs text-red-500 mt-1">{errors.faculty}</p>}
                        </div>

                        {/* Department / Course */}
                        <div className="space-y-2">
                            <Label htmlFor="department" className="text-zinc-900 font-medium">
                                Department / Course <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="department"
                                type="text"
                                disabled={isSubmitting}
                                value={department}
                                onChange={(e) => setDepartment(e.target.value)}
                                onBlur={() => setTouched(prev => ({ ...prev, department: true }))}
                                placeholder="e.g. CSE, Civil, Textile"
                                className={`bg-white h-10 px-3.5 text-sm ${touched.department && errors.department ? 'border-red-500 ring-1 ring-red-500 focus-visible:ring-red-500' : ''}`}
                            />
                            {touched.department && errors.department && <p className="text-xs text-red-500 mt-1">{errors.department}</p>}
                        </div>

                        {/* Batch */}
                        <div className="space-y-2">
                            <Label htmlFor="batch" className="text-zinc-900 font-medium">
                                Batch <span className="text-red-500">*</span>
                            </Label>
                            <Select 
                                value={batch} 
                                onValueChange={(val) => { setBatch(val); setTouched(prev => ({ ...prev, batch: true })); }} 
                                disabled={isSubmitting}
                            >
                                <SelectTrigger className={`bg-white h-10 px-3.5 text-sm w-full [&>span]:line-clamp-none ${touched.batch && errors.batch ? 'border-red-500 ring-1 ring-red-500 focus:ring-red-500' : ''}`}>
                                    <SelectValue placeholder="Select batch" />
                                </SelectTrigger>
                                <SelectContent>
                                    {dropdownData.batches.map((batchOption) => (
                                        <SelectItem key={batchOption} value={batchOption}>
                                            {batchOption}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {touched.batch && errors.batch && <p className="text-xs text-red-500 mt-1">{errors.batch}</p>}
                        </div>

                        {/* Target Pillars - Card-Style Checkbox Grid */}
                        <div className="space-y-3 md:col-span-2 pt-2">
                            <div>
                                <Label className="text-zinc-900 font-semibold text-base">
                                    Applied Pillars <span className="text-red-500">*</span>
                                </Label>
                                <p className="text-sm text-zinc-500 mt-0.5">
                                    Select up to 3 pillars you wish to apply for.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                                {dropdownData.pillars.map((pillar) => {
                                    const isSelected = selectedPillars.includes(pillar);
                                    const isLimitReached = selectedPillars.length >= 3 && !isSelected;
                                    
                                    return (
                                        <div
                                            key={pillar}
                                            onClick={() => {
                                                if (isSubmitting) return;
                                                if (!isLimitReached || isSelected) {
                                                    handlePillarClick(pillar);
                                                }
                                            }}
                                            className={`flex items-center space-x-3 p-4 rounded-xl border transition-all select-none ${
                                                isSubmitting 
                                                    ? "opacity-50 cursor-not-allowed border-zinc-200 bg-zinc-50"
                                                    : isLimitReached 
                                                        ? "opacity-40 cursor-not-allowed border-zinc-200 bg-zinc-50" 
                                                        : isSelected 
                                                            ? "border-zinc-900 bg-white shadow-sm ring-1 ring-zinc-900 cursor-pointer" 
                                                            : "border-zinc-200 bg-white hover:border-zinc-300 cursor-pointer"
                                            }`}
                                        >
                                            <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                                                isSelected ? "bg-zinc-900 border-zinc-900 text-white" : "border-zinc-300 bg-transparent"
                                            }`}>
                                                {isSelected && (
                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                )}
                                            </div>

                                            <span className={`text-sm font-medium ${isSelected ? "text-zinc-900 font-semibold" : "text-zinc-600"}`}>
                                                {pillar}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                            {touched.pillars && errors.pillars && <p className="text-xs text-red-500 mt-1">{errors.pillars}</p>}
                        </div>

                        {/* CV / Resume File Upload */}
                        <div className="space-y-2 md:col-span-2 pt-2">
                            <Label htmlFor="cv" className="text-zinc-900 font-medium">
                                CV / Resume <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="cv"
                                type="file"
                                accept=".pdf,.docx"
                                disabled={isSubmitting}
                                onChange={(e) => {
                                    setCvFile(e.target.files?.[0] || null);
                                    setTouched(prev => ({ ...prev, cv: true }));
                                }}
                                className={`bg-white h-10 px-3.5 py-1.5 text-sm cursor-pointer disabled:opacity-50 ${touched.cv && errors.cv ? 'border-red-500 ring-1 ring-red-500 focus-visible:ring-red-500' : ''}`}
                            />
                            <p className="text-xs text-zinc-500">PDF/DOCX only, Max 5MB.</p>
                            {touched.cv && errors.cv && <p className="text-xs text-red-500 mt-1">{errors.cv}</p>}
                        </div>

                        {/* Portfolio / LinkedIn URL */}
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="portfolio" className="text-zinc-900 font-medium">
                                Portfolio / LinkedIn URL
                            </Label>
                            <Input
                                id="portfolio"
                                type="url"
                                disabled={isSubmitting}
                                value={portfolioUrl}
                                onChange={(e) => setPortfolioUrl(e.target.value)}
                                placeholder="https://linkedin.com/in/..."
                                className="bg-white h-10 px-3.5 text-sm"
                            />
                        </div>

                        {/* Skills / Interests */}
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="interests" className="text-zinc-900 font-medium">
                                Skills / Interests
                            </Label>
                            <textarea
                                id="interests"
                                rows={2}
                                disabled={isSubmitting}
                                value={interests}
                                onChange={(e) => setInterests(e.target.value)}
                                placeholder="e.g. Drama, Volunteer, Music, Football..."
                                className="w-full bg-white rounded-xl border border-zinc-200 p-3 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-900 resize-none disabled:opacity-50"
                            />
                        </div>

                        {/* Clubs / Societies / Experience */}
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="cls" className="text-zinc-900 font-medium">
                                Clubs / Societies / Experience
                            </Label>
                            <textarea
                                id="cls"
                                rows={2}
                                disabled={isSubmitting}
                                value={clubs}
                                onChange={(e) => setClubs(e.target.value)}
                                placeholder="e.g. Leo Club, Rotaract, IEEE..."
                                className="w-full bg-white rounded-xl border border-zinc-200 p-3 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-900 resize-none disabled:opacity-50"
                            />
                        </div>

                    </div>
                </div>

                {/* Actions: Normal-width buttons aligned to the left */}
                <div className="flex items-center gap-4 pt-4">
                    <button 
                        type="submit" 
                        disabled={!isFormValid || isSubmitting}
                        className="py-3 px-8 bg-zinc-900 text-white rounded-xl text-base font-semibold hover:bg-zinc-800 transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center min-w-[180px]"
                    >
                        {isSubmitting ? (
                            <span className="flex items-center gap-2">
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Submitting...
                            </span>
                        ) : (
                            "Submit Application"
                        )}
                    </button>
                    <button 
                        type="button" 
                        onClick={handleClear}
                        disabled={isSubmitting}
                        className="py-3 px-6 bg-white border border-zinc-200 text-zinc-700 rounded-xl text-base font-medium hover:bg-zinc-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Clear Form
                    </button>
                </div>
            </form>

            {/* Success Modal */}
            {showSuccessModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
                        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-2">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-zinc-900">Application Submitted!</h3>
                        <p className="text-sm text-zinc-600">
                            Thank you for applying. Your application has been successfully received and is currently pending review.
                        </p>
                        <button
                            type="button"
                            onClick={() => setShowSuccessModal(false)}
                            className="w-full py-3 bg-zinc-900 text-white rounded-xl font-semibold text-sm hover:bg-zinc-800 transition-colors shadow-sm mt-4"
                        >
                            Got It
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}