'use client';

import { useState, FormEvent, ChangeEvent } from 'react';
import CountdownTimer from './CountdownTimer';

const PILLARS = [
  'Web Pillar', 'HR Pillar', 'Creative Design Pillar', 
  'Content Pillar', 'Marketing Pillar', 'Finance Pillar', 
  'Operations Pillar', 'PR Pillar', 'Video & Photography Pillar', 
  'UI/UX Pillar', 'Business Development Pillar'
];

export default function ApplicationForm() {
  const [isFormClosed, setIsFormClosed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [selectedPillars, setSelectedPillars] = useState<string[]>([]);
  const [fileError, setFileError] = useState('');

  const handlePillarChange = (e: ChangeEvent<HTMLInputElement>, pillar: string) => {
    if (e.target.checked) {
      if (selectedPillars.length >= 3) {
        e.preventDefault();
        alert('You can only select a maximum of 3 pillars.');
        return;
      }
      setSelectedPillars([...selectedPillars, pillar]);
    } else {
      setSelectedPillars(selectedPillars.filter(p => p !== pillar));
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFileError('');
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setFileError('File size must be less than 5MB.');
      e.target.value = ''; // Reset input
      return;
    }

    // Validate type
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type)) {
      setFileError('Only PDF or DOCX files are allowed.');
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitMessage(null);

    if (selectedPillars.length === 0) {
      setSubmitMessage({ type: 'error', text: 'Please select at least one pillar.' });
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData(e.currentTarget);
      
      // Append the selected pillars as a JSON string to the form data
      formData.append('pillars', JSON.stringify(selectedPillars));

      const res = await fetch('/api/apply', {
        method: 'POST',
        body: formData, // Sending as FormData so the backend can extract the file
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong. Please try again.');
      }

      setSubmitMessage({ type: 'success', text: 'Application submitted successfully!' });
      e.currentTarget.reset();
      setSelectedPillars([]);
      
    } catch (error: any) {
      setSubmitMessage({ type: 'error', text: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
      <CountdownTimer onComplete={() => setIsFormClosed(true)} />

      <form 
        onSubmit={handleSubmit} 
        className={`bg-zinc-950 p-6 md:p-8 rounded-2xl shadow-xl border transition-all duration-300 ${isFormClosed ? 'opacity-50 border-zinc-900 pointer-events-none' : 'border-zinc-800'}`}
      >
        <fieldset disabled={isFormClosed || isSubmitting} className="space-y-8">
          
          <div className="border-b border-zinc-800 pb-4">
            <h2 className="text-xl font-semibold text-white">Personal Information</h2>
          </div>

          {/* Name & Index */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">First Name <span className="text-red-500">*</span></label>
              <input required type="text" name="first_name" className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 outline-none" placeholder="e.g. Pamudu" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Last Name <span className="text-red-500">*</span></label>
              <input required type="text" name="last_name" className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 outline-none" placeholder="e.g. Lokuhewa" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Index Number <span className="text-red-500">*</span></label>
              <input required type="text" name="index_number" className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 outline-none" placeholder="e.g. 220366X" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Date of Birth <span className="text-red-500">*</span></label>
              <input required type="date" name="dob" className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 outline-none style-color-scheme-dark" />
            </div>
          </div>

          {/* Contact Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Email <span className="text-red-500">*</span></label>
              <input required type="email" name="email" className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 outline-none" placeholder="e.g. yourname@gmail.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">WhatsApp Mobile <span className="text-red-500">*</span></label>
              <input required type="tel" name="whatsapp_number" className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 outline-none" placeholder="07XXXXXXXX" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Residential Address <span className="text-red-500">*</span></label>
            <textarea required name="address" rows={2} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 outline-none resize-none" placeholder="Enter your full address"></textarea>
          </div>

          <div className="border-b border-zinc-800 pb-4 pt-4">
            <h2 className="text-xl font-semibold text-white">Academic Details</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">University <span className="text-red-500">*</span></label>
              <select required name="university" defaultValue="University of Moratuwa" className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 outline-none">
                <option value="University of Moratuwa">University of Moratuwa</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Faculty <span className="text-red-500">*</span></label>
              <select required name="faculty" defaultValue="" className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 outline-none">
                <option value="" disabled>Select Faculty</option>
                <option value="Engineering">Faculty of Engineering</option>
                <option value="IT">Faculty of IT</option>
                <option value="Business">Faculty of Business</option>
                <option value="NDT">NDT</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Batch <span className="text-red-500">*</span></label>
              <select required name="batch" defaultValue="" className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 outline-none">
                <option value="" disabled>Select Batch</option>
                <option value="21">Batch 21</option>
                <option value="22">Batch 22</option>
                <option value="23">Batch 23</option>
                <option value="24">Batch 24</option>
                <option value="25">Batch 25</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Department / Course <span className="text-red-500">*</span></label>
            <input required type="text" name="department" className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 outline-none" placeholder="e.g. CSE, Civil, Textile" />
          </div>

          <div className="border-b border-zinc-800 pb-4 pt-4">
            <h2 className="text-xl font-semibold text-white">Application Specifics</h2>
          </div>

          {/* Pillars Selection */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Applied Pillars <span className="text-red-500">*</span> <span className="text-zinc-500 text-xs ml-2">(Max 3)</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {PILLARS.map((pillar) => (
                <label key={pillar} className="flex items-center space-x-3 bg-zinc-900/50 p-3 rounded-lg border border-zinc-800/50 cursor-pointer hover:bg-zinc-800 transition-colors">
                  <input 
                    type="checkbox" 
                    onChange={(e) => handlePillarChange(e, pillar)}
                    checked={selectedPillars.includes(pillar)}
                    className="w-4 h-4 rounded border-zinc-700 text-yellow-500 focus:ring-yellow-500/50 bg-zinc-900"
                  />
                  <span className="text-sm text-zinc-300">{pillar}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Experience & Links */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Skills & Interests</label>
            <textarea name="interests" rows={2} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 outline-none resize-none" placeholder="e.g. Graphic Design, Video Editing, Public Speaking"></textarea>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Clubs, Societies & Experience</label>
            <textarea name="clubs" rows={2} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 outline-none resize-none" placeholder="e.g. Rotaract, IEEE, Leo Club"></textarea>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Portfolio / LinkedIn URL</label>
            <input type="url" name="portfolio_url" className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 outline-none" placeholder="https://..." />
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">CV / Resume <span className="text-red-500">*</span> <span className="text-zinc-500 text-xs ml-2">(PDF or DOCX, Max 5MB)</span></label>
            <input 
              required 
              type="file" 
              name="cv_file" 
              accept=".pdf,.doc,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={handleFileChange}
              className="block w-full text-sm text-zinc-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-yellow-500 file:text-zinc-950 hover:file:bg-yellow-400 cursor-pointer border border-zinc-800 rounded-lg bg-zinc-900"
            />
            {fileError && <p className="text-red-500 text-sm mt-2">{fileError}</p>}
          </div>

          {/* Submission Feedback */}
          {submitMessage && (
            <div className={`p-4 rounded-lg text-sm font-medium text-center border ${submitMessage.type === 'success' ? 'bg-green-950/30 border-green-500/50 text-green-400' : 'bg-red-950/30 border-red-500/50 text-red-400'}`}>
              {submitMessage.text}
            </div>
          )}

          <div className="pt-4">
            <button 
              type="submit" 
              className="w-full bg-yellow-500 hover:bg-yellow-400 text-zinc-950 font-bold py-3.5 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting Application...' : 'Submit Application'}
            </button>
          </div>

        </fieldset>
      </form>
    </div>
  );
}