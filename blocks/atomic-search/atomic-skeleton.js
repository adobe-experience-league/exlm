import { isMobile } from '../header/header-utils.js';

export default function createAtomicSkeleton() {
  const skeleton = document.createElement('div');
  if (isMobile()) {
    skeleton.innerHTML = `<div class="atomic-skeleton" style="display: flex; flex-direction: column; gap: 4px; margin: 24px 0;">
      <div style="background: linear-gradient(-90deg, #f0f0f0 0%, #e0e0e0 50%, #f0f0f0 100%);
                    background-size: 400% 400%; animation: skeleton-shimmer 1.2s ease-in-out infinite;
                    border-radius: 4px; height: 18px; width: 50%;">
      </div>
        <div style="background: linear-gradient(-90deg, #f0f0f0 0%, #e0e0e0 50%, #f0f0f0 100%);
                    background-size: 400% 400%; animation: skeleton-shimmer 1.2s ease-in-out infinite;
                    border-radius: 4px; height: 12px; width: 40%; margin: 6px 0">
      </div>
      <div style="background: linear-gradient(-90deg, #f0f0f0 0%, #e0e0e0 50%, #f0f0f0 100%);
                    background-size: 400% 400%; animation: skeleton-shimmer 1.2s ease-in-out infinite;
                    border-radius: 4px; height: 32px; width: 90%; ">
      </div>
    </div>`;
  } else {
    skeleton.innerHTML = `
    <div class="atomic-skeleton" style="display: grid; grid-template-columns: 1.5fr 0.5fr 0.6fr 0.4fr; gap: 16px; align-items: start; border-bottom: 1px solid #ddd; padding: 12px 0; margin-left: 32px;">
      <div>
        <div style="background: linear-gradient(-90deg, #f0f0f0 0%, #e0e0e0 50%, #f0f0f0 100%);
                    background-size: 400% 400%; animation: skeleton-shimmer 1.2s ease-in-out infinite;
                    border-radius: 4px; width: 100%; height: 21px; margin-bottom: 6px;"></div>
        
        <div style="background: linear-gradient(-90deg, #f0f0f0 0%, #e0e0e0 50%, #f0f0f0 100%);
                    background-size: 400% 400%; animation: skeleton-shimmer 1.2s ease-in-out infinite;
                    border-radius: 4px; width: 50%; height: 11px; margin-bottom: 8px;"></div>
        <div style="background: linear-gradient(-90deg, #f0f0f0 0%, #e0e0e0 50%, #f0f0f0 100%);
                    background-size: 400% 400%; animation: skeleton-shimmer 1.2s ease-in-out infinite;
                    border-radius: 4px; width: 100%; height: 36px; margin-bottom: 8px;"></div>
        <div style="background: linear-gradient(-90deg, #f0f0f0 0%, #e0e0e0 50%, #f0f0f0 100%);
                    background-size: 400% 400%; animation: skeleton-shimmer 1.2s ease-in-out infinite;
                    border-radius: 4px; width: 50px; height: 12px; margin-bottom: 6px;"></div>
      </div>
      <div>
        <div style="background: linear-gradient(-90deg, #f0f0f0 0%, #e0e0e0 50%, #f0f0f0 100%);
                    background-size: 400% 400%; animation: skeleton-shimmer 1.2s ease-in-out infinite;
                    border-radius: 4px; height: 26px; width: 80px; "></div>
      </div>
      <div>
        <div style="background: linear-gradient(-90deg, #f0f0f0 0%, #e0e0e0 50%, #f0f0f0 100%);
                    background-size: 400% 400%; animation: skeleton-shimmer 1.2s ease-in-out infinite;
                    border-radius: 4px; height: 24px; width: 120px;"></div>
      </div>
      <div>
        <div style="background: linear-gradient(-90deg, #f0f0f0 0%, #e0e0e0 50%, #f0f0f0 100%);
                    background-size: 400% 400%; animation: skeleton-shimmer 1.2s ease-in-out infinite;
                    border-radius: 4px; height: 14px; width: 60px;"></div>
      </div>
    </div>
    `;
  }
  return skeleton;
}
