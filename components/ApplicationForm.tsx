'use client';

import { useState, useMemo, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import CountdownTimer from '@/components/CountdownTimer';
import { allowedPillarSlugs } from '@/lib/pillarAccess';
import { Turnstile } from '@marsidev/react-turnstile';

interface FormConfig {
    app_name: string;
    app_description: string;
    eligible_universities: string[];
    eligible_batches: string[];
    eligible_faculties: string[];
    index_number_hint: string;
    phone_hint: string;
    allow_multi_university: boolean;
    pillar_access: Record<string, string[]>;
    default_pillars: string[] | null;
}

interface Pillar {
    id: string;
    name: string;
    slug: string;
}

const FALLBACK_CONFIG: FormConfig = {
    app_name: 'MoraSpirit Volunteer Recruitment',
    app_description: 'Join MoraSpirit and be part of our amazing team!',
    eligible_universities: ['University of Moratuwa'],
    eligible_batches: ['Batch 21', 'Batch 22', 'Batch 23', 'Batch 24', 'Batch 25'],
    eligible_faculties: [
        'Faculty of Engineering',
        'Faculty of Information Technology',
        'Faculty of Architecture',
        'Faculty of Business',
        'Faculty of Medicine',
        'NDT',
    ],
    index_number_hint: 'e.g. 220123X',
    phone_hint: 'e.g. 0712345678 or +94712345678',
    allow_multi_university: false,
    pillar_access: {},
    default_pillars: null,
};

// Only used if /api/pillars is unreachable. Slugs must match the `pillars`
// table — a mismatch filters every pillar out and leaves the form empty.
const FALLBACK_PILLARS: Pillar[] = [
    { id: 'f1', name: 'Announcing and Hosting Pillar', slug: 'announcing' },
    { id: 'f2', name: 'Corporate Development Pillar', slug: 'corporate' },
    { id: 'f3', name: 'Creative Design Pillar', slug: 'creative' },
    { id: 'f4', name: 'Editorial Pillar', slug: 'editorial' },
    { id: 'f5', name: 'Financial Controlling Panel', slug: 'finance' },
    { id: 'f6', name: 'Human Resources Management Pillar', slug: 'hr' },
    { id: 'f7', name: 'Marketing Pillar', slug: 'marketing' },
    { id: 'f8', name: 'Photography Pillar', slug: 'photography' },
    { id: 'f9', name: 'Special Projects Pillar', slug: 'special' },
    { id: 'f10', name: 'Video Editing & Live Streaming Pillar', slug: 'video' },
    { id: 'f11', name: 'Web and Technology Pillar', slug: 'web' },
];

// Shared input class helpers
const baseInput =
    'w-full h-10 px-3.5 text-sm rounded-lg border bg-white text-zinc-900 placeholder:text-zinc-400 outline-none transition-colors';
const validInput = 'border-zinc-300 focus:border-red-400 focus:ring-2 focus:ring-red-100';
const errorInput = 'border-red-400 ring-2 ring-red-100';

function fieldClass(touched: boolean, hasError: boolean) {
    return `${baseInput} ${touched && hasError ? errorInput : validInput}`;
}

export default function ApplicationForm() {
    const [formConfig, setFormConfig] = useState<FormConfig>(FALLBACK_CONFIG);
    const [pillars, setPillars] = useState<Pillar[]>(FALLBACK_PILLARS);
    const [configLoaded, setConfigLoaded] = useState(false);

    // Form fields
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
    const [batch, setBatch] = useState('');
    const [batchOther, setBatchOther] = useState('');
    const [faculty, setFaculty] = useState('');
    const [facultyOther, setFacultyOther] = useState('');
    const [department, setDepartment] = useState('');
    const [university, setUniversity] = useState('');
    const [universityOther, setUniversityOther] = useState('');
    const [selectedPillars, setSelectedPillars] = useState<string[]>([]);

    // UI
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [serverError, setServerError] = useState<string | null>(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [isFormClosed, setIsFormClosed] = useState(false);
    const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
    const [turnstileKey, setTurnstileKey] = useState(0);

    useEffect(() => {
        const load = async () => {
            try {
                const [cfgRes, pillarsRes, settingsRes] = await Promise.all([
                    fetch('/api/form-config', { cache: 'no-store' }),
                    fetch('/api/pillars', { cache: 'no-store' }),
                    fetch('/api/settings', { cache: 'no-store' }),
                ]);

                if (cfgRes.ok) {
                    const cfg = await cfgRes.json();
                    const merged = { ...FALLBACK_CONFIG, ...cfg };
                    setFormConfig(merged);
                    if (merged.eligible_universities?.length === 1) {
                        setUniversity(merged.eligible_universities[0]);
                    }
                }

                if (pillarsRes.ok) {
                    const { pillars: pData } = await pillarsRes.json();
                    if (pData?.length) setPillars(pData);
                }

                if (settingsRes.ok) {
                    const s = await settingsRes.json();
                    const now = new Date();
                    const isManuallyClosed = s?.is_open === false;
                    const isNotOpenYet = s?.opening_time && now < new Date(s.opening_time);
                    const isDeadlinePassed = s?.closing_time && now > new Date(s.closing_time);
                    if (isManuallyClosed || isNotOpenYet || isDeadlinePassed) {
                        setIsFormClosed(true);
                    }
                }
            } catch (err) {
                console.error('Failed to load config:', err);
            } finally {
                setConfigLoaded(true);
            }
        };
        load();
    }, []);

    const singleUniversity =
        formConfig.eligible_universities.length === 1 || !formConfig.allow_multi_university;

    // Resolve "Other" sentinel to the typed value before validation / submission
    const resolvedFaculty    = faculty    === '__OTHER__' ? facultyOther.trim()    : faculty;
    const resolvedBatch      = batch      === '__OTHER__' ? batchOther.trim()      : batch;
    const resolvedUniversity = university === '__OTHER__' ? universityOther.trim() : university;

    // Pillars this university is actually recruiting for. Mirrors the check in
    // /api/apply — the server rejects anything outside this set regardless.
    const visiblePillars = useMemo(() => {
        const allowed = new Set(
            allowedPillarSlugs(
                resolvedUniversity,
                formConfig.pillar_access,
                formConfig.default_pillars,
                pillars.map((p) => p.slug),
            ),
        );
        return pillars.filter((p) => allowed.has(p.slug));
    }, [resolvedUniversity, formConfig.pillar_access, formConfig.default_pillars, pillars]);

    // Switching university can strip pillars the applicant already ticked.
    useEffect(() => {
        const names = new Set(visiblePillars.map((p) => p.name));
        setSelectedPillars((prev) => {
            const next = prev.filter((n) => names.has(n));
            return next.length === prev.length ? prev : next;
        });
    }, [visiblePillars]);

    const touch = (f: string) => setTouched((p) => ({ ...p, [f]: true }));

    const normalizePhone = (v: string) => v.replace(/[\s\-().]/g, '');

    const errors = useMemo(() => {
        const e: Record<string, string> = {};
        if (!firstName.trim()) e.firstName = 'First name is required.';
        if (!lastName.trim()) e.lastName = 'Last name is required.';
        if (!indexNumber.trim()) e.indexNumber = 'Index number is required.';
        if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
            e.email = 'Please enter a valid email address.';
        const ph = normalizePhone(whatsappNumber);
        if (!ph || !/^\+?\d{7,15}$/.test(ph))
            e.whatsappNumber = 'Enter a valid number, e.g. 0712345678 or +94712345678.';
        if (!dob.trim()) e.dob = 'Date of birth is required.';
        if (!address.trim()) e.address = 'Address is required.';

        if (!resolvedUniversity) e.university = 'Please select or enter your university.';
        else if (university === '__OTHER__' && !universityOther.trim())
            e.university = 'Please type your university name.';

        if (!resolvedFaculty) e.faculty = 'Please select or enter your faculty.';
        else if (faculty === '__OTHER__' && !facultyOther.trim())
            e.faculty = 'Please type your faculty name.';

        if (!department.trim()) e.department = 'Department is required.';

        if (!resolvedBatch) e.batch = 'Please select or enter your batch.';
        else if (batch === '__OTHER__' && !batchOther.trim())
            e.batch = 'Please type your batch.';

        if (selectedPillars.length === 0) e.pillars = 'Select at least 1 pillar (max 3).';
        if (!cvFile) e.cv = 'CV / Resume is required.';
        if (portfolioUrl.trim()) {
            try { new URL(portfolioUrl); } catch { e.portfolioUrl = 'Must be a valid URL.'; }
        }
        return e;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [firstName, lastName, indexNumber, email, whatsappNumber, dob, address,
        resolvedUniversity, university, universityOther,
        resolvedFaculty, faculty, facultyOther,
        department,
        resolvedBatch, batch, batchOther,
        selectedPillars, cvFile, portfolioUrl]);

    const isFormValid = Object.keys(errors).length === 0;

    const handlePillarClick = (p: string) => {
        setSelectedPillars((prev) =>
            prev.includes(p) ? prev.filter((x) => x !== p) : prev.length < 3 ? [...prev, p] : prev
        );
        touch('pillars');
    };

    const handleClear = () => {
        setFirstName(''); setLastName(''); setIndexNumber('');
        setEmail(''); setWhatsappNumber(''); setDob('');
        setAddress(''); setCvFile(null); setPortfolioUrl('');
        setInterests(''); setClubs('');
        setBatch(''); setBatchOther('');
        setFaculty(''); setFacultyOther('');
        setDepartment('');
        if (!singleUniversity) { setUniversity(''); setUniversityOther(''); }
        setSelectedPillars([]);
        setTouched({}); setServerError(null);
        setTurnstileToken(null);
        setTurnstileKey((k) => k + 1);
    };

    const handleSubmit = async (e: React.SyntheticEvent) => {
        e.preventDefault();
        if (isFormClosed) return;

        const allTouched: Record<string, boolean> = {};
        ['firstName', 'lastName', 'indexNumber', 'email', 'whatsappNumber', 'dob',
            'address', 'university', 'faculty', 'department', 'batch', 'pillars', 'cv']
            .forEach((k) => (allTouched[k] = true));
        setTouched(allTouched);

        if (!isFormValid) return;
        setServerError(null);
        setIsSubmitting(true);

        const payload = {
            batch: resolvedBatch,
            firstName, lastName, indexNumber,
            faculty: resolvedFaculty,
            department,
            university: resolvedUniversity,
            email, whatsappNumber: normalizePhone(whatsappNumber), dob, address,
            portfolioUrl: portfolioUrl || undefined,
            pillars: selectedPillars,
            interests: interests || undefined,
            clubs: clubs || undefined,
        };

        const formData = new FormData();
        formData.append('cv', cvFile!);
        formData.append('turnstileToken', turnstileToken || '');
        formData.append('data', JSON.stringify(payload));

        try {
            const res = await fetch('/api/apply', { method: 'POST', body: formData });
            const result = await res.json();
            if (!res.ok) throw new Error(result.error || 'Submission failed. Please try again.');
            handleClear();
            setShowSuccessModal(true);
        } catch (err: any) {
            setServerError(err.message || 'An error occurred. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto w-full">
            {/* Countdown */}
            <CountdownTimer onComplete={() => setIsFormClosed(true)} />

            {/* Page heading */}
            {configLoaded && (
                <div className="mb-6 text-center">
                    <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900">
                        {formConfig.app_name}
                    </h1>
                    {formConfig.app_description && (
                        <p className="text-zinc-500 text-sm mt-2">{formConfig.app_description}</p>
                    )}
                </div>
            )}

            <form
                onSubmit={handleSubmit}
                className={`bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden transition-opacity duration-300 ${isFormClosed ? 'opacity-50 pointer-events-none' : ''}`}
            >
                <fieldset disabled={isFormClosed || isSubmitting}>
                    {serverError && (
                        <div className="mx-6 mt-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium">
                            {serverError}
                        </div>
                    )}

                    {/* ── SECTION 1: Personal Information ── */}
                    <section className="p-6 sm:p-8">
                        <SectionHeader
                            number="1"
                            title="Personal Information"
                            description="Your contact and identification details."
                        />

                        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                            <Field label="First Name" required error={touched.firstName ? errors.firstName : undefined}>
                                <input
                                    type="text"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    onBlur={() => touch('firstName')}
                                    placeholder="e.g. Nimal"
                                    className={fieldClass(!!touched.firstName, !!errors.firstName)}
                                />
                            </Field>

                            <Field label="Last Name" required error={touched.lastName ? errors.lastName : undefined}>
                                <input
                                    type="text"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    onBlur={() => touch('lastName')}
                                    placeholder="e.g. Perera"
                                    className={fieldClass(!!touched.lastName, !!errors.lastName)}
                                />
                            </Field>

                            <Field label="Email" required error={touched.email ? errors.email : undefined}>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    onBlur={() => touch('email')}
                                    placeholder="e.g. nimal@gmail.com"
                                    className={fieldClass(!!touched.email, !!errors.email)}
                                />
                            </Field>

                            <Field label="WhatsApp Number" required error={touched.whatsappNumber ? errors.whatsappNumber : undefined}>
                                <input
                                    type="tel"
                                    value={whatsappNumber}
                                    onChange={(e) => setWhatsappNumber(e.target.value)}
                                    onBlur={() => touch('whatsappNumber')}
                                    placeholder={formConfig.phone_hint}
                                    className={fieldClass(!!touched.whatsappNumber, !!errors.whatsappNumber)}
                                />
                            </Field>

                            <Field label="Date of Birth" required error={touched.dob ? errors.dob : undefined}>
                                <input
                                    type="date"
                                    value={dob}
                                    onChange={(e) => setDob(e.target.value)}
                                    onBlur={() => touch('dob')}
                                    className={`${fieldClass(!!touched.dob, !!errors.dob)} [&::-webkit-calendar-picker-indicator]:cursor-pointer`}
                                />
                            </Field>

                            <Field label="Address" required error={touched.address ? errors.address : undefined} className="sm:col-span-2">
                                <textarea
                                    rows={2}
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    onBlur={() => touch('address')}
                                    placeholder="Enter your residential address..."
                                    className={`w-full px-3.5 py-2.5 text-sm rounded-lg border bg-white text-zinc-900 placeholder:text-zinc-400 outline-none transition-colors resize-none ${touched.address && errors.address ? errorInput : validInput}`}
                                />
                            </Field>
                        </div>
                    </section>

                    <Divider />

                    {/* ── SECTION 2: Academic Details ── */}
                    <section className="p-6 sm:p-8">
                        <SectionHeader
                            number="2"
                            title="Academic Details"
                            description="Your university and course information."
                        />

                        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5 items-start">
                            {/* University */}
                            {singleUniversity ? (
                                <Field label="University" required>
                                    <input
                                        value={formConfig.eligible_universities[0] || 'University of Moratuwa'}
                                        readOnly
                                        className={`${baseInput} border-zinc-200 bg-zinc-50 text-zinc-500 cursor-not-allowed`}
                                    />
                                </Field>
                            ) : (
                                <Field label="University" required error={touched.university ? errors.university : undefined}>
                                    <Select value={university} onValueChange={(v) => { setUniversity(v); touch('university'); }}>
                                        <SelectTrigger className={`${baseInput} ${touched.university && errors.university ? errorInput : validInput} data-[placeholder]:text-zinc-400`}>
                                            <SelectValue placeholder="Select university" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {formConfig.eligible_universities.map((u) => (
                                                <SelectItem key={u} value={u}>{u}</SelectItem>
                                            ))}
                                            <SelectItem value="__OTHER__">Other — type below</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {university === '__OTHER__' && (
                                        <input
                                            type="text"
                                            value={universityOther}
                                            onChange={(e) => setUniversityOther(e.target.value)}
                                            onBlur={() => touch('university')}
                                            placeholder="Type your university name..."
                                            className={`${baseInput} mt-2 ${touched.university && !universityOther.trim() ? errorInput : validInput}`}
                                            autoFocus
                                        />
                                    )}
                                </Field>
                            )}

                            <Field label="Index Number" required error={touched.indexNumber ? errors.indexNumber : undefined}>
                                <input
                                    type="text"
                                    value={indexNumber}
                                    onChange={(e) => setIndexNumber(e.target.value)}
                                    onBlur={() => touch('indexNumber')}
                                    placeholder={formConfig.index_number_hint}
                                    className={fieldClass(!!touched.indexNumber, !!errors.indexNumber)}
                                />
                            </Field>

                            <Field label="Faculty" required error={touched.faculty ? errors.faculty : undefined}>
                                <Select value={faculty} onValueChange={(v) => { setFaculty(v); touch('faculty'); }}>
                                    <SelectTrigger className={`${baseInput} ${touched.faculty && errors.faculty ? errorInput : validInput} data-[placeholder]:text-zinc-400`}>
                                        <SelectValue placeholder="Select faculty" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {formConfig.eligible_faculties.map((f) => (
                                            <SelectItem key={f} value={f}>{f}</SelectItem>
                                        ))}
                                        <SelectItem value="__OTHER__">Other — type below</SelectItem>
                                    </SelectContent>
                                </Select>
                                {faculty === '__OTHER__' && (
                                    <input
                                        type="text"
                                        value={facultyOther}
                                        onChange={(e) => setFacultyOther(e.target.value)}
                                        onBlur={() => touch('faculty')}
                                        placeholder="Type your faculty name..."
                                        className={`${baseInput} mt-2 ${touched.faculty && !facultyOther.trim() ? errorInput : validInput}`}
                                        autoFocus
                                    />
                                )}
                            </Field>

                            <Field label="Department / Course" required error={touched.department ? errors.department : undefined}>
                                <input
                                    type="text"
                                    value={department}
                                    onChange={(e) => setDepartment(e.target.value)}
                                    onBlur={() => touch('department')}
                                    placeholder="e.g. CSE, Civil, Textile"
                                    className={fieldClass(!!touched.department, !!errors.department)}
                                />
                            </Field>

                            <Field label="Batch" required error={touched.batch ? errors.batch : undefined}>
                                <Select value={batch} onValueChange={(v) => { setBatch(v); touch('batch'); }}>
                                    <SelectTrigger className={`${baseInput} ${touched.batch && errors.batch ? errorInput : validInput} data-[placeholder]:text-zinc-400`}>
                                        <SelectValue placeholder="Select batch" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {formConfig.eligible_batches.map((b) => (
                                            <SelectItem key={b} value={b}>{b}</SelectItem>
                                        ))}
                                        <SelectItem value="__OTHER__">Other — type below</SelectItem>
                                    </SelectContent>
                                </Select>
                                {batch === '__OTHER__' && (
                                    <input
                                        type="text"
                                        value={batchOther}
                                        onChange={(e) => setBatchOther(e.target.value)}
                                        onBlur={() => touch('batch')}
                                        placeholder="Type your batch or intake year..."
                                        className={`${baseInput} mt-2 ${touched.batch && !batchOther.trim() ? errorInput : validInput}`}
                                        autoFocus
                                    />
                                )}
                            </Field>
                        </div>
                    </section>

                    <Divider />

                    {/* ── SECTION 3: Pillar Selection ── */}
                    <section className="p-6 sm:p-8">
                        <SectionHeader
                            number="3"
                            title="Applied Pillars"
                            description={`Choose up to 3 pillars you wish to apply for. (${selectedPillars.length}/3 selected)`}
                        />

                        {!resolvedUniversity && (
                            <p className="mt-4 text-sm text-zinc-500 bg-zinc-50 border border-zinc-200 rounded-xl p-4">
                                Select your university above to see the pillars recruiting from it.
                            </p>
                        )}

                        {resolvedUniversity && visiblePillars.length === 0 && (
                            <p className="mt-4 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-4">
                                There are no pillars currently recruiting from {resolvedUniversity}.
                                Please check back later.
                            </p>
                        )}

                        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {visiblePillars.map(({ name: pillar }) => {
                                const isSelected = selectedPillars.includes(pillar);
                                const isDisabled = selectedPillars.length >= 3 && !isSelected;

                                return (
                                    <button
                                        key={pillar}
                                        type="button"
                                        onClick={() => !isDisabled && handlePillarClick(pillar)}
                                        className={`flex items-center gap-3 w-full p-3.5 rounded-xl border text-left transition-all ${isDisabled
                                            ? 'opacity-40 cursor-not-allowed border-zinc-200 bg-zinc-50'
                                            : isSelected
                                                ? 'border-red-500 bg-red-50 ring-1 ring-red-200 cursor-pointer'
                                                : 'border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50 cursor-pointer'
                                            }`}
                                    >
                                        <span className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-red-600 border-red-600' : 'border-zinc-300 bg-white'}`}>
                                            {isSelected && (
                                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                        </span>
                                        <span className={`text-sm font-medium ${isSelected ? 'text-red-800' : 'text-zinc-600'}`}>
                                            {pillar}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                        {touched.pillars && errors.pillars && (
                            <p className="text-xs text-red-600 mt-2">{errors.pillars}</p>
                        )}
                    </section>

                    <Divider />

                    {/* ── SECTION 4: Documents & Optional ── */}
                    <section className="p-6 sm:p-8">
                        <SectionHeader
                            number="4"
                            title="Documents & Additional Info"
                            description="Upload your CV and share any extra details."
                        />

                        <div className="mt-6 space-y-5">
                            <Field label="CV / Resume" required error={touched.cv ? errors.cv : undefined}>
                                <input
                                    type="file"
                                    accept=".pdf,.docx"
                                    onChange={(e) => { setCvFile(e.target.files?.[0] || null); touch('cv'); }}
                                    className={`${fieldClass(!!touched.cv, !!errors.cv)} py-1.5 cursor-pointer file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-zinc-100 file:text-zinc-700 hover:file:bg-zinc-200`}
                                />
                                <p className="text-xs text-zinc-400 mt-1.5">PDF or DOCX only · Max 5 MB</p>
                            </Field>

                            <Field label="Portfolio / LinkedIn URL" error={touched.portfolioUrl ? errors.portfolioUrl : undefined}>
                                <input
                                    type="url"
                                    value={portfolioUrl}
                                    onChange={(e) => setPortfolioUrl(e.target.value)}
                                    onBlur={() => touch('portfolioUrl')}
                                    placeholder="https://linkedin.com/in/..."
                                    className={fieldClass(!!touched.portfolioUrl, !!errors.portfolioUrl)}
                                />
                            </Field>

                            <Field label="Skills / Interests">
                                <textarea
                                    rows={3}
                                    value={interests}
                                    onChange={(e) => setInterests(e.target.value)}
                                    placeholder="e.g. Drama, volunteer work, music, football..."
                                    className={`w-full px-3.5 py-2.5 text-sm rounded-lg border border-zinc-300 bg-white text-zinc-900 placeholder:text-zinc-400 outline-none transition-colors resize-none focus:border-red-400 focus:ring-2 focus:ring-red-100`}
                                />
                            </Field>

                            <Field label="Clubs / Societies / Experience">
                                <textarea
                                    rows={3}
                                    value={clubs}
                                    onChange={(e) => setClubs(e.target.value)}
                                    placeholder="e.g. Leo Club, Rotaract, IEEE, AIESEC..."
                                    className={`w-full px-3.5 py-2.5 text-sm rounded-lg border border-zinc-300 bg-white text-zinc-900 placeholder:text-zinc-400 outline-none transition-colors resize-none focus:border-red-400 focus:ring-2 focus:ring-red-100`}
                                />
                            </Field>
                        </div>
                    </section>

                    <Divider />

                    {/* ── SECTION 5: Security & Submit ── */}
                    <section className="p-6 sm:p-8">
                        <Label className="text-sm font-medium text-zinc-700">Security Verification</Label>
                        <div className="mt-3">
                            <Turnstile
                                key={turnstileKey}
                                siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'}
                                onSuccess={(token) => setTurnstileToken(token)}
                                onError={() => setTurnstileToken(null)}
                                onExpire={() => setTurnstileToken(null)}
                                options={{ theme: 'light' }}
                            />
                        </div>

                        <div className="mt-6 flex flex-col sm:flex-row gap-3">
                            <button
                                type="submit"
                                disabled={!isFormValid || isSubmitting || isFormClosed || !turnstileToken}
                                className="flex-1 sm:flex-none sm:min-w-[180px] h-11 px-8 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Submitting…
                                    </>
                                ) : (
                                    'Submit Application'
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={handleClear}
                                disabled={isSubmitting || isFormClosed}
                                className="h-11 px-6 border border-zinc-300 text-zinc-600 rounded-xl text-sm font-medium hover:bg-zinc-50 hover:text-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Clear Form
                            </button>
                        </div>
                    </section>
                </fieldset>
            </form>

            {/* Success Modal */}
            {showSuccessModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
                    <div className="bg-white border border-zinc-200 rounded-2xl p-8 max-w-md w-full shadow-xl text-center space-y-4">
                        <div className="w-14 h-14 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center mx-auto">
                            <svg className="w-7 h-7 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-zinc-900">Application Submitted!</h3>
                        <p className="text-sm text-zinc-500">
                            Thank you for applying to MoraSpirit. Your application has been received and is
                            currently pending review. We will contact you if you are selected.
                        </p>
                        <button
                            type="button"
                            onClick={() => setShowSuccessModal(false)}
                            className="w-full h-11 bg-red-600 text-white rounded-xl font-semibold text-sm hover:bg-red-700 transition-colors"
                        >
                            Got It
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Small layout helpers ──────────────────────────────────────────────────────

function SectionHeader({
    number,
    title,
    description,
}: {
    number: string;
    title: string;
    description?: string;
}) {
    return (
        <div className="flex items-start gap-3">
            <span className="w-7 h-7 rounded-full bg-red-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                {number}
            </span>
            <div>
                <h3 className="text-base font-semibold text-zinc-900">{title}</h3>
                {description && <p className="text-sm text-zinc-500 mt-0.5">{description}</p>}
            </div>
        </div>
    );
}

function Divider() {
    return <hr className="border-zinc-100" />;
}

function Field({
    label,
    required,
    error,
    children,
    className,
}: {
    label: string;
    required?: boolean;
    error?: string;
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div className={className}>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">
                {label}
                {required && <span className="text-red-500 ml-0.5">*</span>}
                {!required && <span className="text-zinc-400 font-normal ml-1">(optional)</span>}
            </label>
            {children}
            {error && <p className="text-xs text-red-600 mt-1.5">{error}</p>}
        </div>
    );
}
