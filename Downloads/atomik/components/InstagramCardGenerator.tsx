
import React, { useRef, useState } from 'react';
import * as htmlToImage from 'html-to-image';
import { Download, Instagram, X, ChevronLeft, ChevronRight, Loader2, Check } from 'lucide-react';
import { Opportunity } from '../types';
import Button from './Button';

interface InstagramCardGeneratorProps {
  opportunity: Opportunity;
  onClose: () => void;
}

const InstagramCardGenerator: React.FC<InstagramCardGeneratorProps> = ({ opportunity, onClose }) => {
  const card1Ref = useRef<HTMLDivElement>(null);
  const card2Ref = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [downloaded, setDownloaded] = useState<number[]>([]);

  const downloadCard = async (pageNum: number) => {
    const ref = pageNum === 1 ? card1Ref : card2Ref;
    if (!ref.current) return;

    setIsGenerating(true);
    try {
      const dataUrl = await htmlToImage.toPng(ref.current, {
        quality: 1,
        pixelRatio: 2, // Higher resolution for Instagram
      });
      
      const link = document.createElement('a');
      link.download = `atomik-card-${pageNum}-${opportunity.title.toLowerCase().replace(/\s+/g, '-')}.png`;
      link.href = dataUrl;
      link.click();
      
      setDownloaded(prev => [...prev, pageNum]);
    } catch (err) {
      console.error('Failed to generate image', err);
      alert('Failed to generate image. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-auto md:h-[600px]">
        
        {/* Preview Area */}
        <div className="flex-1 bg-gray-100 p-8 flex flex-col items-center justify-center relative min-h-[400px]">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/50 hover:bg-white rounded-full transition-colors z-10"
          >
            <X size={20} />
          </button>

          <div className="relative group">
            {/* Card 1: Main Info */}
            <div 
              ref={card1Ref}
              className={`w-[320px] h-[320px] bg-[#111827] text-white p-20 flex flex-col justify-between relative overflow-hidden shadow-2xl ${currentPage === 1 ? 'block' : 'hidden'}`}
              style={{ width: '1080px', height: '1080px', transform: 'scale(0.3)', transformOrigin: 'center', margin: '-378px' }}
            >
              {/* Background Accents */}
              <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-[#F59E0B]/20 rounded-full blur-[120px]"></div>
              <div className="absolute bottom-[-5%] left-[-5%] w-[40%] h-[40%] bg-[#F59E0B]/10 rounded-full blur-[80px]"></div>
              
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-20">
                  <span className="text-4xl font-black tracking-tighter uppercase leading-none text-[#F59E0B]">Atomik</span>
                </div>

                <div className="space-y-10">
                  <div className="flex items-center gap-4">
                    <div className="h-1.5 w-16 bg-[#F59E0B]"></div>
                    <span className="text-4xl font-bold text-[#F59E0B] uppercase tracking-[0.4em]">
                      {opportunity.type}
                    </span>
                  </div>
                  <div className="max-h-[450px] overflow-hidden">
                    <h1 className="text-[80px] font-black leading-[1.1] tracking-tighter uppercase break-words hyphens-none">
                      {opportunity.title}
                    </h1>
                  </div>
                </div>
              </div>

              <div className="relative z-10 grid grid-cols-2 gap-16 border-t-8 border-[#F59E0B] pt-16">
                <div className="space-y-4">
                  <p className="text-3xl font-bold text-[#F59E0B] uppercase tracking-[0.2em]">Organizer</p>
                  <p className="text-4xl font-black uppercase leading-tight break-words line-clamp-2">{opportunity.organizer}</p>
                </div>
                <div className="space-y-4 text-right">
                  <p className="text-3xl font-bold text-[#F59E0B] uppercase tracking-[0.2em]">Deadline</p>
                  <p className="text-5xl font-black uppercase text-white bg-[#F59E0B]/20 px-6 py-3 inline-block rounded-xl">{opportunity.deadline}</p>
                </div>
              </div>
            </div>

            {/* Card 2: Details & Eligibility */}
            <div 
              ref={card2Ref}
              className={`w-[320px] h-[320px] bg-white text-[#111827] p-20 flex flex-col justify-between relative overflow-hidden shadow-2xl ${currentPage === 2 ? 'block' : 'hidden'}`}
              style={{ width: '1080px', height: '1080px', transform: 'scale(0.3)', transformOrigin: 'center', margin: '-378px' }}
            >
              {/* Top Border Accent */}
              <div className="absolute top-0 left-0 w-full h-12 bg-[#F59E0B]"></div>
              
              <div className="relative z-10 flex flex-col h-full justify-center space-y-20">
                <div className="flex justify-between items-center">
                   <div className="space-y-4">
                      <p className="text-4xl font-bold text-[#F59E0B] uppercase tracking-[0.2em]">Total Value</p>
                      <p className="text-8xl font-black uppercase tracking-tighter leading-none break-words">{opportunity.grantOrPrize}</p>
                   </div>
                   <span className="text-4xl font-black tracking-tighter uppercase leading-none text-[#111827]">Atomik</span>
                </div>

                <div className="space-y-16">
                  <div className="space-y-10">
                    <div className="flex items-center gap-4">
                      <div className="h-1.5 w-16 bg-[#F59E0B]"></div>
                      <p className="text-4xl font-bold text-[#F59E0B] uppercase tracking-[0.4em]">Eligibility</p>
                    </div>
                    <div className="grid grid-cols-1 gap-y-8">
                      {opportunity.eligibility.slice(0, 4).map((item, i) => (
                        <div key={i} className="text-5xl font-black flex items-start gap-6 uppercase leading-tight break-words">
                          <div className="w-5 h-5 bg-[#F59E0B] mt-3 flex-shrink-0 rotate-45"></div>
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Arrows */}
            <button 
              onClick={() => setCurrentPage(prev => prev === 1 ? 2 : 1)}
              className="absolute left-[-20px] top-1/2 -translate-y-1/2 p-3 bg-white shadow-lg rounded-full hover:bg-gray-50 transition-all z-10"
            >
              <ChevronLeft size={24} />
            </button>
            <button 
              onClick={() => setCurrentPage(prev => prev === 1 ? 2 : 1)}
              className="absolute right-[-20px] top-1/2 -translate-y-1/2 p-3 bg-white shadow-lg rounded-full hover:bg-gray-50 transition-all z-10"
            >
              <ChevronRight size={24} />
            </button>
          </div>

          <div className="mt-8 flex gap-2">
            <div className={`w-2 h-2 rounded-full ${currentPage === 1 ? 'bg-[#F59E0B]' : 'bg-gray-300'}`}></div>
            <div className={`w-2 h-2 rounded-full ${currentPage === 2 ? 'bg-[#F59E0B]' : 'bg-gray-300'}`}></div>
          </div>
        </div>

        {/* Controls Area */}
        <div className="w-full md:w-80 p-8 flex flex-col justify-between border-l border-gray-100">
          <div>
            <div className="flex items-center gap-2 text-[#F59E0B] mb-2">
              <Instagram size={20} />
              <span className="text-xs font-black uppercase tracking-widest">Instagram Export</span>
            </div>
            <h2 className="text-2xl font-black text-[#111827] mb-6 leading-tight">Generate Social Assets</h2>
            
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-gray-100 bg-gray-50">
                <p className="text-xs font-bold text-gray-500 uppercase mb-2">Page 1: Hero Card</p>
                <Button 
                  fullWidth 
                  variant={downloaded.includes(1) ? 'secondary' : 'primary'}
                  onClick={() => downloadCard(1)}
                  disabled={isGenerating}
                >
                  {isGenerating && currentPage === 1 ? <Loader2 className="animate-spin mr-2" size={18} /> : downloaded.includes(1) ? <Check className="mr-2" size={18} /> : <Download className="mr-2" size={18} />}
                  {downloaded.includes(1) ? 'Downloaded' : 'Download PNG'}
                </Button>
              </div>

              <div className="p-4 rounded-xl border border-gray-100 bg-gray-50">
                <p className="text-xs font-bold text-gray-500 uppercase mb-2">Page 2: Details Card</p>
                <Button 
                  fullWidth 
                  variant={downloaded.includes(2) ? 'secondary' : 'primary'}
                  onClick={() => downloadCard(2)}
                  disabled={isGenerating}
                >
                  {isGenerating && currentPage === 2 ? <Loader2 className="animate-spin mr-2" size={18} /> : downloaded.includes(2) ? <Check className="mr-2" size={18} /> : <Download className="mr-2" size={18} />}
                  {downloaded.includes(2) ? 'Downloaded' : 'Download PNG'}
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-100">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-4">Pro Tip: Post as a Carousel</p>
            <Button fullWidth variant="outline" onClick={onClose}>Close Generator</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstagramCardGenerator;
