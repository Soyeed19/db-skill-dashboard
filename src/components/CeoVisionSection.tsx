import React from 'react';

export const CeoVisionSection: React.FC = () => {
  return (
    <section className="py-12 bg-slate-50 border-y border-slate-200">
      <div className="max-w-6xl mx-auto px-6">
        <div className="bg-white border border-slate-200 rounded-xs shadow-2xs overflow-hidden flex flex-col md:flex-row items-center gap-8 p-6 md:p-10">
          
          {/* Left Column: Official Quote & Commitments */}
          <div className="w-full md:w-2/3 border-b md:border-b-0 md:border-r border-slate-200 pb-6 md:pb-0 md:pr-10 order-2 md:order-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-[#007A3D] border border-emerald-200 text-[11px] font-bold mb-4 uppercase tracking-wider">
              <span>🎯</span>
              <span>Founder's Message & National Commitment</span>
            </div>
            
            <blockquote className="text-base md:text-lg font-medium text-slate-700 leading-relaxed italic border-l-2 border-[#007A3D] pl-4 my-2">
              "Service to Nation, in terms of Valuing Human's life is to create a Safer Road to Travel & Generate Livelihood to live, Thats what DB Skills and Livelihood does, Serving India's Largest Drivers Training and Certification Program."
            </blockquote>

            <div className="mt-4 text-left">
              <span className="text-sm font-bold text-slate-900">— Gopal Mani</span>
              <span className="block text-xs text-[#007A3D] font-semibold">Founder, DBSL</span>
            </div>
          </div>

          {/* Right Column: Founder Portrait Card */}
          <div className="w-full md:w-1/3 flex flex-col items-center text-center order-1 md:order-2">
            <div className="relative w-48 h-56 md:w-52 md:h-60 rounded-xs overflow-hidden border-2 border-[#007A3D] shadow-sm bg-slate-100">
              <img
                src="/assets/founder-gopal-mani.jpg"
                alt="Gopal Mani - Founder, DBSL"
                className="w-full h-full object-cover object-top"
                onError={(e) => {
                  e.currentTarget.src = '/founder-gopal-mani.jpg';
                }}
              />
            </div>
            <h3 className="mt-4 text-lg font-bold text-slate-900 tracking-tight">
              Gopal Mani
            </h3>
            <p className="text-xs font-semibold text-[#007A3D] tracking-wide uppercase">
              Founder, DBSL
            </p>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              DB Skills & Livelihood
            </p>
          </div>

        </div>
      </div>
    </section>
  );
};

export default CeoVisionSection;
