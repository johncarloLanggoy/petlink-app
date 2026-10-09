// ── MAIN ENTRY POINT ─────────────────────────────────────────────────

// Import all modules
import * as sidebar from './sidebar.js';
import * as auth from './auth.js';
import * as appointments from './appointments.js';
import * as pets from './pets.js';
import * as messages from './messages.js';
import * as datepicker from './datepicker.js';
import * as modals from './modals.js';
import * as socket from './socket.js';
import { showToast, formatDuration, formatTime } from './utils.js';

// ── AI RECOMMENDATIONS TOGGLE STATE ──────────────────────────────────
let aiRecommendationsVisible = false;

// ═══════════════════════════════════════════════════════════════════
// ✅ Helper: Ensure max-height + scroll sa AI Recommendations Container
// ═══════════════════════════════════════════════════════════════════
function ensureAIContainerScroll(container) {
    if (!container) return;
    
    // Desktop: 700px max-height, Mobile: 500px max-height
    const isMobile = window.innerWidth <= 768;
    const maxHeight = isMobile ? '500px' : '700px';
    
    container.style.maxHeight = maxHeight;
    container.style.overflowY = 'auto';
    container.style.overflowX = 'hidden';
    container.style.paddingRight = isMobile ? '4px' : '8px';
    container.style.scrollBehavior = 'smooth';
    container.style.display = 'block';
}

// ═══════════════════════════════════════════════════════════════════
// ✅ UPDATED: Helper: Render AI Recommendation Cards (COMPACT GRID)
//    ✅ KASAMA NA ANG MEDICAL HISTORY AT MEDICAL RECORDS DISPLAY
//    ✅ IMPROVED UI: Better spacing, no ugly scrollbars, consistent heights
//    ✅ WITH MAX-HEIGHT: Container may scroll kapag maraming pets
// ═══════════════════════════════════════════════════════════════════
function renderAIRecommendationCards(recommendations, container) {
    if (!recommendations || recommendations.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; background: #ffffff; border-radius: 16px; border: 1px solid #d4e5c4;">
                <div style="font-size: 48px; margin-bottom: 15px; color: #7ba05b;"><i class="fas fa-paw"></i></div>
                <h3 style="color: #2d3e1f; margin-bottom: 10px;">No Recommendations Yet</h3>
                <p style="color: #4a5a3f; font-size: 14px; line-height: 1.6;">Register a pet first or wait for AI recommendations to be generated.</p>
            </div>
        `;
        ensureAIContainerScroll(container);
        return;
    }
    
    const hasPending = recommendations.some(r => r.validation_status === 'pending');
    const hasRejected = recommendations.some(r => r.validation_status === 'rejected');
    
    let infoBanner = '';
    
    if (hasPending) {
        infoBanner += `
            <div style="
                background: linear-gradient(135deg, rgba(245, 158, 11, 0.08), rgba(251, 191, 36, 0.08));
                border: 1px solid rgba(245, 158, 11, 0.3);
                border-left: 4px solid #f59e0b;
                border-radius: 12px;
                padding: 12px 16px;
                margin-bottom: 16px;
                display: flex;
                align-items: flex-start;
                gap: 10px;
            ">
                <i class="fas fa-info-circle" style="color: #f59e0b; font-size: 16px; margin-top: 2px; flex-shrink: 0;"></i>
                <div style="flex: 1;">
                    <div style="color: #92400e; font-weight: 700; font-size: 12px; margin-bottom: 3px;">
                        Waiting for Veterinarian Approval
                    </div>
                    <div style="color: #78350f; font-size: 11px; line-height: 1.4;">
                        Some AI recommendations are still <strong>pending review</strong>. These are informational only.
                    </div>
                </div>
            </div>
        `;
    }
    
    if (hasRejected) {
        infoBanner += `
            <div style="
                background: linear-gradient(135deg, rgba(239, 68, 68, 0.08), rgba(220, 38, 38, 0.08));
                border: 1px solid rgba(239, 68, 68, 0.3);
                border-left: 4px solid #ef4444;
                border-radius: 12px;
                padding: 12px 16px;
                margin-bottom: 16px;
                display: flex;
                align-items: flex-start;
                gap: 10px;
            ">
                <i class="fas fa-times-circle" style="color: #ef4444; font-size: 16px; margin-top: 2px; flex-shrink: 0;"></i>
                <div style="flex: 1;">
                    <div style="color: #991b1b; font-weight: 700; font-size: 12px; margin-bottom: 3px;">
                        Some Recommendations Not Approved
                    </div>
                    <div style="color: #7f1d1d; font-size: 11px; line-height: 1.4;">
                        Our veterinarian did not approve some AI recommendations. You can click <strong>"Get New Recommendations"</strong> para sa bagong recommendations.
                    </div>
                </div>
            </div>
        `;
    }
    
    let cardsHTML = '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 20px; align-items: start; padding-bottom: 4px;">';
    
    recommendations.forEach((rec) => {
        const validationStatus = rec.validation_status || 'pending';
        const vetNotes = rec.vet_notes;
        const recommendationsList = rec.recommendations || [];
        
        const petType = rec.pet_type || 'Dog';
        const isCat = petType.toLowerCase() === 'cat';
        const fallbackIcon = isCat ? 'fa-cat' : 'fa-dog';
        const petImage = rec.pet_image || '';
        const safePetName = (rec.pet_name || 'Pet').replace(/'/g, "\\'").replace(/"/g, '&quot;');
        
        // ✅ Capitalize first letter ng pet name
        const petName = rec.pet_name ? (rec.pet_name.charAt(0).toUpperCase() + rec.pet_name.slice(1)) : 'Unknown';
        
        // ✅ NEW: Medical history at records
        const medicalHistory = rec.medical_history || '';
        const medicalRecordCount = rec.medical_record_count || 0;
        
        let cardBorderColor = '#f59e0b';
        if (validationStatus === 'validated') cardBorderColor = '#10b981';
        else if (validationStatus === 'rejected') cardBorderColor = '#ef4444';
        
        // ✅ Compact validation badge
        let validationBadgeHTML = '';
        if (validationStatus === 'validated') {
            validationBadgeHTML = `
                <span style="display: inline-flex; align-items: center; gap: 3px; background: rgba(16, 185, 129, 0.12); color: #10b981; font-size: 9px; font-weight: 700; padding: 3px 8px; border-radius: 8px; border: 1px solid rgba(16, 185, 129, 0.3); white-space: nowrap; letter-spacing: 0.3px;">
                    <i class="fas fa-check-circle" style="font-size: 9px;"></i> APPROVED
                </span>
            `;
        } else if (validationStatus === 'rejected') {
            validationBadgeHTML = `
                <span style="display: inline-flex; align-items: center; gap: 3px; background: rgba(239, 68, 68, 0.12); color: #ef4444; font-size: 9px; font-weight: 700; padding: 3px 8px; border-radius: 8px; border: 1px solid rgba(239, 68, 68, 0.3); white-space: nowrap; letter-spacing: 0.3px;">
                    <i class="fas fa-times-circle" style="font-size: 9px;"></i> REJECTED
                </span>
            `;
        } else {
            validationBadgeHTML = `
                <span style="display: inline-flex; align-items: center; gap: 3px; background: rgba(245, 158, 11, 0.12); color: #f59e0b; font-size: 9px; font-weight: 700; padding: 3px 8px; border-radius: 8px; border: 1px solid rgba(245, 158, 11, 0.3); white-space: nowrap; letter-spacing: 0.3px;">
                    <i class="fas fa-clock" style="font-size: 9px;"></i> PENDING
                </span>
            `;
        }
        
        let avatarHTML = '';
        if (petImage) {
            avatarHTML = `
                <div style="width: 40px; height: 40px; border-radius: 50%; background: #f7fbf3; border: 2px solid ${cardBorderColor}; overflow: hidden; flex-shrink: 0; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 2px 6px rgba(0,0,0,0.08);" 
                     onclick="window.openPetViewer('${petImage}', '${safePetName}')" 
                     title="Click to view ${safePetName}'s photo">
                    <img src="${petImage}" alt="${petName}" style="width: 100%; height: 100%; object-fit: cover; pointer-events: none;">
                </div>
            `;
        } else {
            avatarHTML = `
                <div style="width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, rgba(123, 160, 91, 0.15), rgba(90, 122, 63, 0.15)); border: 2px solid ${cardBorderColor}; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 18px; color: #5a7a3f; box-shadow: 0 2px 6px rgba(0,0,0,0.08);">
                    <i class="fas ${fallbackIcon}"></i>
                </div>
            `;
        }
        
        // ✅ Build recommendations list — walang scroll, full display
        let recList = '';
        if (recommendationsList.length === 0) {
            recList = `<div style="text-align: center; padding: 16px; color: #94a387; font-size: 12px; font-style: italic;">No recommendations available.</div>`;
        } else {
            recommendationsList.forEach((recText, idx) => {
                let iconClass = 'fas fa-info-circle';
                let iconColor = '#7ba05b';
                let iconBg = 'rgba(123, 160, 91, 0.12)';
                
                const textLower = (recText || '').toLowerCase();
                
                if (textLower.includes('allerg')) {
                    iconClass = 'fas fa-exclamation-triangle'; iconColor = '#ef4444'; iconBg = 'rgba(239, 68, 68, 0.12)';
                } else if (textLower.includes('vaccin')) {
                    iconClass = 'fas fa-syringe'; iconColor = '#f59e0b'; iconBg = 'rgba(245, 158, 11, 0.12)';
                } else if (textLower.includes('groom') || textLower.includes('brush') || textLower.includes('coat')) {
                    iconClass = 'fas fa-scissors'; iconColor = '#7ba05b'; iconBg = 'rgba(123, 160, 91, 0.12)';
                } else if (textLower.includes('health') || textLower.includes('risk')) {
                    iconClass = 'fas fa-heartbeat'; iconColor = '#10b981'; iconBg = 'rgba(16, 185, 129, 0.12)';
                } else if (textLower.includes('senior') || textLower.includes('young')) {
                    iconClass = 'fas fa-paw'; iconColor = '#7ba05b'; iconBg = 'rgba(123, 160, 91, 0.12)';
                } else if (textLower.includes('daily') || textLower.includes('eye clean')) {
                    iconClass = 'fas fa-eye'; iconColor = '#7ba05b'; iconBg = 'rgba(123, 160, 91, 0.12)';
                } else if (textLower.includes('check-up') || textLower.includes('checkup')) {
                    iconClass = 'fas fa-stethoscope'; iconColor = '#10b981'; iconBg = 'rgba(16, 185, 129, 0.12)';
                } else if (textLower.includes('care') || textLower.includes('routine')) {
                    iconClass = 'fas fa-heart'; iconColor = '#7ba05b'; iconBg = 'rgba(123, 160, 91, 0.12)';
                } else if (textLower.includes('avoid') || textLower.includes('trigger')) {
                    iconClass = 'fas fa-ban'; iconColor = '#ef4444'; iconBg = 'rgba(239, 68, 68, 0.12)';
                } else if (textLower.includes('medical') || textLower.includes('record')) {
                    iconClass = 'fas fa-notes-medical'; iconColor = '#7ba05b'; iconBg = 'rgba(123, 160, 91, 0.12)';
                } else if (textLower.includes('diabetes') || textLower.includes('insulin')) {
                    iconClass = 'fas fa-syringe'; iconColor = '#f59e0b'; iconBg = 'rgba(245, 158, 11, 0.12)';
                } else if (textLower.includes('seizure') || textLower.includes('epilepsy')) {
                    iconClass = 'fas fa-brain'; iconColor = '#f59e0b'; iconBg = 'rgba(245, 158, 11, 0.12)';
                } else if (textLower.includes('joint') || textLower.includes('arthritis')) {
                    iconClass = 'fas fa-bone'; iconColor = '#f59e0b'; iconBg = 'rgba(245, 158, 11, 0.12)';
                } else if (textLower.includes('dental') || textLower.includes('tooth')) {
                    iconClass = 'fas fa-tooth'; iconColor = '#f59e0b'; iconBg = 'rgba(245, 158, 11, 0.12)';
                } else if (textLower.includes('skin') || textLower.includes('dermatitis')) {
                    iconClass = 'fas fa-band-aid'; iconColor = '#f59e0b'; iconBg = 'rgba(245, 158, 11, 0.12)';
                }
                
                const isLast = idx === recommendationsList.length - 1;
                
                recList += `
                    <div style="display: flex; align-items: flex-start; gap: 10px; padding: 8px 0; ${!isLast ? 'border-bottom: 1px dashed #f0f7eb;' : ''}">
                        <span style="
                            display: inline-flex;
                            align-items: center;
                            justify-content: center;
                            width: 22px;
                            height: 22px;
                            border-radius: 6px;
                            background: ${iconBg};
                            color: ${iconColor};
                            font-size: 10px;
                            flex-shrink: 0;
                            margin-top: 1px;
                        ">
                            <i class="${iconClass}"></i>
                        </span>
                        <span style="flex: 1; font-size: 12px; line-height: 1.5; color: #2d3e1f; word-wrap: break-word;">${recText}</span>
                    </div>
                `;
            });
        }
        
        const healthRisk = rec.health_risk || 'Low';
        let riskColor = '#10b981';
        let riskBg = 'rgba(16, 185, 129, 0.1)';
        if (healthRisk === 'High') {
            riskColor = '#ef4444';
            riskBg = 'rgba(239, 68, 68, 0.1)';
        } else if (healthRisk === 'Medium') {
            riskColor = '#f59e0b';
            riskBg = 'rgba(245, 158, 11, 0.1)';
        }
        
        // ✅ Medical History Badge — compact at malinis
        let medicalHistoryHTML = '';
        if (medicalHistory && medicalHistory.trim() !== '' && medicalHistory !== 'None' && medicalHistory !== 'none' && medicalHistory !== 'N/A') {
            const displayMedHistory = medicalHistory.length > 60 
                ? medicalHistory.substring(0, 60) + '...' 
                : medicalHistory;
            
            medicalHistoryHTML = `
                <div style="display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: rgba(245, 158, 11, 0.06); border: 1px solid rgba(245, 158, 11, 0.25); border-radius: 8px;">
                    <i class="fas fa-notes-medical" style="color: #f59e0b; font-size: 12px; flex-shrink: 0;"></i>
                    <div style="flex: 1; min-width: 0;">
                        <div style="color: #92400e; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 1px;">Medical History</div>
                        <div style="color: #78350f; font-size: 11px; line-height: 1.3; word-wrap: break-word; font-weight: 500;" title="${medicalHistory}">${displayMedHistory}</div>
                    </div>
                </div>
            `;
        }
        
        // ✅ Medical Records Badge — compact, color-coded
        let medicalRecordsHTML = '';
        if (medicalRecordCount > 0) {
            const recordColor = medicalRecordCount >= 5 ? '#ef4444' : (medicalRecordCount >= 2 ? '#f59e0b' : '#7ba05b');
            const recordBg = medicalRecordCount >= 5 ? 'rgba(239, 68, 68, 0.06)' : (medicalRecordCount >= 2 ? 'rgba(245, 158, 11, 0.06)' : 'rgba(123, 160, 91, 0.06)');
            const recordBorder = medicalRecordCount >= 5 ? 'rgba(239, 68, 68, 0.25)' : (medicalRecordCount >= 2 ? 'rgba(245, 158, 11, 0.25)' : 'rgba(123, 160, 91, 0.25)');
            
            medicalRecordsHTML = `
                <div style="display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: ${recordBg}; border: 1px solid ${recordBorder}; border-radius: 8px;">
                    <i class="fas fa-file-medical" style="color: ${recordColor}; font-size: 12px; flex-shrink: 0;"></i>
                    <div style="flex: 1;">
                        <span style="color: ${recordColor}; font-size: 11px; font-weight: 600;">
                            ${medicalRecordCount} medical record${medicalRecordCount === 1 ? '' : 's'}
                        </span>
                    </div>
                </div>
            `;
        }
        
        let vetNotesHTML = '';
        if (vetNotes && vetNotes.trim() !== '') {
            vetNotesHTML = `
                <div style="
                    background: rgba(123, 160, 91, 0.06);
                    border-left: 3px solid #7ba05b;
                    border-radius: 6px;
                    padding: 8px 12px;
                    font-size: 11px;
                ">
                    <div style="color: #5a7a3f; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; display: flex; align-items: center; gap: 4px;">
                        <i class="fas fa-user-md"></i> Vet's Notes
                    </div>
                    <div style="color: #2d3e1f; line-height: 1.5; font-size: 11px;">${vetNotes}</div>
                </div>
            `;
        }
        
        let rejectedNoticeHTML = '';
        if (validationStatus === 'rejected') {
            rejectedNoticeHTML = `
                <div style="
                    background: rgba(239, 68, 68, 0.06);
                    border-left: 3px solid #ef4444;
                    border-radius: 6px;
                    padding: 8px 12px;
                    font-size: 11px;
                ">
                    <div style="color: #991b1b; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; display: flex; align-items: center; gap: 4px;">
                        <i class="fas fa-times-circle"></i> Not Approved
                    </div>
                    <div style="color: #7f1d1d; line-height: 1.5;">
                        Hindi approved ng vet ang recommendation na ito. I-click ang <strong>"Get New Recommendations"</strong> para makakuha ng bagong AI recommendation.
                    </div>
                </div>
            `;
        }
        
        let regenerateBtnText = 'Regenerate';
        let regenerateBtnIcon = 'fa-sync-alt';
        let regenerateBtnBg = 'linear-gradient(135deg, #8b5cf6, #7c3aed)';
        let regenerateBtnShadow = '0 2px 8px rgba(139, 92, 246, 0.25)';
        
        if (validationStatus === 'rejected') {
            regenerateBtnText = 'Get New Recommendations';
            regenerateBtnIcon = 'fa-redo-alt';
            regenerateBtnBg = 'linear-gradient(135deg, #ef4444, #dc2626)';
            regenerateBtnShadow = '0 2px 8px rgba(239, 68, 68, 0.25)';
        }
        
        // ═══════════════════════════════════════════════════════════════
        // ✅ MAIN CARD — Clean, no scroll, consistent layout
        // ═══════════════════════════════════════════════════════════════
        cardsHTML += `
            <div style="
                background: #ffffff;
                border-radius: 16px;
                padding: 18px;
                border: 2px solid ${cardBorderColor};
                transition: all 0.3s ease;
                display: flex;
                flex-direction: column;
                gap: 12px;
                ${validationStatus === 'rejected' ? 'opacity: 0.95;' : ''}
            ">
                
                <!-- ═══ HEADER: Avatar + Name + Badge ═══ -->
                <div style="display: flex; align-items: center; gap: 12px;">
                    ${avatarHTML}
                    <div style="flex: 1; min-width: 0;">
                        <div style="color: #2d3e1f; font-size: 16px; font-weight: 700; line-height: 1.2; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                            ${petName}
                        </div>
                        <div style="color: #94a387; font-size: 11px; margin-top: 2px; display: flex; align-items: center; gap: 4px;">
                            <i class="fas ${fallbackIcon}" style="font-size: 10px;"></i>
                            ${petType} • ${rec.breed || 'Mixed'}
                        </div>
                    </div>
                    ${validationBadgeHTML}
                </div>
                
                <!-- ═══ STATS ROW ═══ -->
                <div style="display: flex; gap: 6px; background: #f7fbf3; border-radius: 10px; padding: 10px 8px; border: 1px solid #eaf3e0;">
                    <div style="flex: 1; text-align: center;">
                        <div style="color: #94a387; font-size: 9px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Age</div>
                        <div style="color: #2d3e1f; font-size: 13px; font-weight: 700; margin-top: 2px;">${rec.age || '?'}</div>
                    </div>
                    <div style="width: 1px; background: #d4e5c4;"></div>
                    <div style="flex: 1; text-align: center;">
                        <div style="color: #94a387; font-size: 9px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Risk</div>
                        <div style="color: ${riskColor}; font-size: 13px; font-weight: 700; margin-top: 2px;">${healthRisk}</div>
                    </div>
                    <div style="width: 1px; background: #d4e5c4;"></div>
                    <div style="flex: 1; text-align: center;">
                        <div style="color: #94a387; font-size: 9px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Vaccine</div>
                        <div style="color: #5a7a3f; font-size: 13px; font-weight: 700; margin-top: 2px;">${rec.vaccine_priority || 'Med'}</div>
                    </div>
                    <div style="width: 1px; background: #d4e5c4;"></div>
                    <div style="flex: 1; text-align: center;">
                        <div style="color: #94a387; font-size: 9px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Records</div>
                        <div style="color: ${medicalRecordCount >= 5 ? '#ef4444' : (medicalRecordCount >= 2 ? '#f59e0b' : '#7ba05b')}; font-size: 13px; font-weight: 700; margin-top: 2px;">${medicalRecordCount}</div>
                    </div>
                </div>
                
                <!-- ═══ MEDICAL HISTORY & RECORDS ═══ -->
                ${medicalHistoryHTML ? `<div style="display: flex; flex-direction: column; gap: 8px;">${medicalHistoryHTML}${medicalRecordsHTML}</div>` : (medicalRecordsHTML ? `<div>${medicalRecordsHTML}</div>` : '')}
                
                <!-- ═══ RECOMMENDATIONS LIST (NO SCROLL) ═══ -->
                <div style="display: flex; flex-direction: column;">
                    ${recList}
                </div>
                
                <!-- ═══ VET NOTES & REJECTED NOTICE ═══ -->
                ${vetNotesHTML}
                ${rejectedNoticeHTML}
                
                <!-- ═══ FOOTER: Date + Regenerate Button ═══ -->
                <div style="display: flex; justify-content: space-between; align-items: center; gap: 10px; margin-top: auto; padding-top: 12px; border-top: 1px solid #f0f7eb;">
                    ${rec.prediction_date 
                        ? `<div style="color: #94a387; font-size: 9px; flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                             <i class="fas fa-clock"></i> ${rec.prediction_date}
                           </div>` 
                        : '<div></div>'}
                    
                    <button data-regenerate-pet-id="${rec.pet_id}"
                            class="regenerate-pet-btn"
                            style="
                                background: ${regenerateBtnBg};
                                color: #ffffff;
                                border: none;
                                padding: 8px 16px;
                                border-radius: 10px;
                                font-size: 11px;
                                font-weight: 700;
                                cursor: pointer;
                                transition: all 0.25s ease;
                                display: inline-flex;
                                align-items: center;
                                gap: 6px;
                                font-family: 'Poppins', sans-serif;
                                box-shadow: ${regenerateBtnShadow};
                                white-space: nowrap;
                                flex-shrink: 0;
                                letter-spacing: 0.3px;
                            "
                            onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 16px rgba(139, 92, 246, 0.35)';"
                            onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='${regenerateBtnShadow}';"
                            title="Generate new AI recommendations for this pet">
                        <i class="fas ${regenerateBtnIcon}"></i> ${regenerateBtnText}
                    </button>
                </div>
                
            </div>
        `;
    });
    
    cardsHTML += '</div>';
    
    container.innerHTML = infoBanner + cardsHTML;
    
    // ✅ Ensure max-height + scroll
    ensureAIContainerScroll(container);
    
    // ✅ I-ATTACH ANG EVENT LISTENERS SA LAHAT NG REGENERATE BUTTONS
    const regenerateButtons = container.querySelectorAll('.regenerate-pet-btn');
    console.log('🔧 Attaching listeners to', regenerateButtons.length, 'regenerate buttons');
    
    regenerateButtons.forEach((btn) => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const petId = parseInt(this.dataset.regeneratePetId);
            console.log('🖱️ Regenerate button clicked for petId:', petId);
            
            regeneratePetRecommendation(petId);
        });
    });
}

// ═══════════════════════════════════════════════════════════════════
// ✅ Regenerate Recommendation for a Single Pet
// ═══════════════════════════════════════════════════════════════════
async function regeneratePetRecommendation(petId) {
    console.log('🔄 regeneratePetRecommendation called with petId:', petId);
    
    const currentRecs = window._aiRecommendationsData || [];
    const currentRec = currentRecs.find(r => r.pet_id === petId);
    const petName = currentRec ? currentRec.pet_name : 'this pet';
    const petType = currentRec ? (currentRec.pet_type || 'Dog') : 'Dog';
    const petImage = currentRec ? (currentRec.pet_image || '') : '';
    
    const petIcon = petType.toLowerCase() === 'cat' ? 'fa-cat' : 'fa-dog';
    
    let avatarHTML = '';
    if (petImage) {
        avatarHTML = `
            <div style="width: 56px; height: 56px; border-radius: 50%; background: #f7fbf3; border: 3px solid #8b5cf6; overflow: hidden; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                <img src="${petImage}" alt="${petName}" style="width: 100%; height: 100%; object-fit: cover;">
            </div>
        `;
    } else {
        avatarHTML = `
            <div style="width: 56px; height: 56px; border-radius: 50%; background: linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(124, 58, 237, 0.15)); border: 3px solid #8b5cf6; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 26px; color: #7c3aed;">
                <i class="fas ${petIcon}"></i>
            </div>
        `;
    }
    
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'regenerateConfirmModal';
    overlay.style.zIndex = '3000';
    
    overlay.innerHTML = `
        <div class="modal-popup" style="max-width: 460px; text-align: center; position: relative;">
            
            <div style="
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 80px;
                height: 80px;
                border-radius: 24px;
                background: linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(124, 58, 237, 0.15));
                color: #7c3aed;
                font-size: 36px;
                margin-bottom: 16px;
            ">
                <i class="fas fa-sync-alt"></i>
            </div>
            
            <h3 style="color: #5a7a3f; font-size: 22px; margin: 0 0 10px 0; font-weight: 700;">
                Re-Recommend?
            </h3>
            
            <p style="color: #4a5a3f; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
                Gusto mo bang mag-generate ng <strong style="color: #7c3aed;">BAGONG</strong> AI recommendation para sa pet na ito?
            </p>
            
            <div style="
                background: linear-gradient(135deg, #f7fbf3, #eaf3e0);
                border-radius: 14px;
                padding: 16px 18px;
                border: 1px solid #d4e5c4;
                margin-bottom: 20px;
                display: flex;
                align-items: center;
                gap: 12px;
                text-align: left;
            ">
                ${avatarHTML}
                <div style="flex: 1; min-width: 0;">
                    <div style="color: #2d3e1f; font-size: 15px; font-weight: 700; margin-bottom: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                        ${petName}
                    </div>
                    <div style="color: #7c3aed; font-size: 11px; font-weight: 600; display: flex; align-items: center; gap: 4px;">
                        <i class="fas ${petIcon}"></i> ${petType}
                    </div>
                </div>
            </div>
            
            <div style="
                background: rgba(245, 158, 11, 0.08);
                border: 1px solid rgba(245, 158, 11, 0.3);
                border-left: 4px solid #f59e0b;
                border-radius: 10px;
                padding: 12px 14px;
                margin-bottom: 22px;
                display: flex;
                align-items: flex-start;
                gap: 10px;
                text-align: left;
            ">
                <i class="fas fa-exclamation-triangle" style="color: #f59e0b; font-size: 15px; margin-top: 2px; flex-shrink: 0;"></i>
                <p style="color: #92400e; font-size: 12px; margin: 0; line-height: 1.5;">
                    Ang <strong>lumang recommendation</strong> ay mapapalitan ng bago. Kailangan ulit itong i-review ng veterinarian.
                </p>
            </div>
            
            <div class="modal-buttons" style="justify-content: center; gap: 10px;">
                <button type="button" 
                        id="regenerateCancelBtn"
                        class="modal-btn modal-btn-cancel"
                        style="
                            flex: 1;
                            background: #e2e8f0;
                            color: #475569;
                            padding: 12px 20px;
                            border-radius: 12px;
                            font-weight: 600;
                            cursor: pointer;
                            border: none;
                            font-family: 'Poppins', sans-serif;
                            font-size: 14px;
                            display: inline-flex;
                            align-items: center;
                            justify-content: center;
                            gap: 6px;
                            transition: all 0.25s ease;
                        ">
                    <i class="fas fa-times"></i> Cancel
                </button>
                <button type="button" 
                        id="regenerateConfirmBtn"
                        class="modal-btn modal-btn-submit"
                        style="
                            flex: 1;
                            background: linear-gradient(135deg, #8b5cf6, #7c3aed);
                            color: #ffffff;
                            padding: 12px 20px;
                            border-radius: 12px;
                            font-weight: 600;
                            cursor: pointer;
                            border: none;
                            font-family: 'Poppins', sans-serif;
                            font-size: 14px;
                            display: inline-flex;
                            align-items: center;
                            justify-content: center;
                            gap: 6px;
                            box-shadow: 0 4px 15px rgba(139, 92, 246, 0.35);
                            transition: all 0.25s ease;
                        ">
                    <i class="fas fa-sync-alt"></i> Yes, Regenerate
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    const cancelBtn = document.getElementById('regenerateCancelBtn');
    const confirmBtn = document.getElementById('regenerateConfirmBtn');
    
    cancelBtn.addEventListener('click', function() {
        closeRegenerateConfirmModal();
    });
    cancelBtn.addEventListener('mouseover', function() {
        this.style.background = '#cbd5e1';
        this.style.transform = 'translateY(-1px)';
    });
    cancelBtn.addEventListener('mouseout', function() {
        this.style.background = '#e2e8f0';
        this.style.transform = 'translateY(0)';
    });
    
    confirmBtn.addEventListener('click', function() {
        console.log('✅ Confirm regenerate clicked for petId:', petId);
        executeRegenerate(petId);
    });
    confirmBtn.addEventListener('mouseover', function() {
        this.style.transform = 'translateY(-2px)';
        this.style.boxShadow = '0 8px 25px rgba(139, 92, 246, 0.45)';
    });
    confirmBtn.addEventListener('mouseout', function() {
        this.style.transform = 'translateY(0)';
        this.style.boxShadow = '0 4px 15px rgba(139, 92, 246, 0.35)';
    });
    
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
            closeRegenerateConfirmModal();
        }
    });
    
    const escHandler = function(e) {
        if (e.key === 'Escape') {
            closeRegenerateConfirmModal();
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler);
}

function closeRegenerateConfirmModal() {
    const modal = document.getElementById('regenerateConfirmModal');
    if (modal) modal.remove();
}

// ═══════════════════════════════════════════════════════════════════
// ── Execute Regenerate ─────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════
async function executeRegenerate(petId) {
    console.log('🔄 executeRegenerate called with petId:', petId);
    
    closeRegenerateConfirmModal();
    
    const currentRecs = window._aiRecommendationsData || [];
    const currentRec = currentRecs.find(r => r.pet_id === petId);
    const petName = currentRec ? currentRec.pet_name : 'this pet';
    const wasRejected = currentRec && currentRec.validation_status === 'rejected';
    
    const container = document.getElementById('aiRecommendationsContainer');
    
    if (container) {
        container.style.opacity = '0.6';
        container.style.pointerEvents = 'none';
    }
    
    showToast('<i class="fas fa-spinner fa-spin"></i> Generating new recommendation...', 'info');
    
    try {
        console.log('🔄 Calling /api/ml/pet/' + petId + '/regenerate...');
        
        const res = await fetch(`/api/ml/pet/${petId}/regenerate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        
        console.log('🔄 Response status:', res.status);
        
        if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        
        const data = await res.json();
        console.log('🔄 Regenerate response data:', data);
        
        if (data.success) {
            const successMessage = wasRejected
                ? `<i class="fas fa-check-circle"></i> Bagong recommendation generated para kay ${petName}! Naka-pending na ulit ito para i-review ng vet.`
                : `<i class="fas fa-check-circle"></i> Bagong recommendation generated para kay ${petName}!`;
            
            showToast(successMessage, 'success');
            
            const cacheBuster = Date.now();
            const refreshRes = await fetch(`/api/ml/predict/all-with-status?_=${cacheBuster}`, {
                cache: 'no-store',
                headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            });
            const refreshData = await refreshRes.json();
            
            console.log('🔄 Refreshed data:', refreshData.recommendations?.length || 0, 'items');
            
            if (refreshData.success && refreshData.recommendations) {
                window._aiRecommendationsData = refreshData.recommendations;
                renderAIRecommendationCards(refreshData.recommendations, container);
                console.log('✅ Cards re-rendered');
            }
        } else {
            console.error('❌ Server error:', data.message);
            showToast(data.message || 'Error regenerating recommendation.', 'error');
        }
    } catch (error) {
        console.error('❌ Error regenerating recommendation:', error);
        showToast(`Error: ${error.message}`, 'error');
    } finally {
        if (container) {
            container.style.opacity = '1';
            container.style.pointerEvents = 'auto';
        }
    }
}

// ═══════════════════════════════════════════════════════════════════
// ── AI RECOMMENDATIONS MAIN FUNCTION ───────────────────────────────
// ═══════════════════════════════════════════════════════════════════
async function refreshAIRecommendations() {
    const container = document.getElementById('aiRecommendationsContainer');
    const btn = document.querySelector('.btn-smart-care');
    
    if (!container) {
        console.warn('AI Recommendations container not found');
        return;
    }
    
    if (aiRecommendationsVisible) {
        container.innerHTML = '';
        container.style.display = 'none';
        aiRecommendationsVisible = false;
        
        if (btn) {
            btn.innerHTML = '<i class="fas fa-sync-alt"></i> Get Recommendations';
        }
        
        showToast('<i class="fas fa-eye-slash"></i> Recommendations hidden', 'info');
        return;
    }
    
    console.log('🔄 Refreshing AI recommendations from server...');
    
    // ✅ Apply max-height + scroll
    ensureAIContainerScroll(container);
    
    container.innerHTML = `
        <div style="text-align: center; padding: 40px; background: #ffffff; border-radius: 16px; border: 1px solid #d4e5c4;">
            <div style="display: inline-block; width: 40px; height: 40px; border: 3px solid #eaf3e0; border-top-color: #7ba05b; border-radius: 50%; animation: spin 0.8s linear infinite; margin-bottom: 15px;"></div>
            <p style="color: #94a387;"><i class="fas fa-spinner fa-spin"></i> Generating AI recommendations...</p>
        </div>
    `;
    
    try {
        const cacheBuster = Date.now();
        const res = await fetch(`/api/ml/predict/all-with-status?_=${cacheBuster}`, {
            cache: 'no-store',
            headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            }
        });
        const data = await res.json();
        
        console.log('🔄 Fetched recommendations:', data.recommendations?.length || 0, 'items');
        
        if (data.success && data.recommendations && data.recommendations.length > 0) {
            window._aiRecommendationsData = data.recommendations;
            
            renderAIRecommendationCards(data.recommendations, container);
            
            aiRecommendationsVisible = true;
            if (btn) {
                btn.innerHTML = '<i class="fas fa-eye-slash"></i> Hide Recommendations';
            }
            
            try {
                const statusRes = await fetch('/api/ml/status');
                const statusData = await statusRes.json();
                if (statusData.success && statusData.models_loaded) {
                    showToast('<i class="fas fa-check-circle"></i> AI recommendations loaded.', 'success');
                } else {
                    showToast('<i class="fas fa-info-circle"></i> Recommendations loaded.', 'info');
                }
            } catch (e) {}
            
        } else {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; background: #ffffff; border-radius: 16px; border: 1px solid #d4e5c4;">
                    <div style="font-size: 48px; margin-bottom: 15px; color: #7ba05b;"><i class="fas fa-paw"></i></div>
                    <h3 style="color: #2d3e1f; margin-bottom: 10px;">No Pets Registered</h3>
                    <p style="color: #4a5a3f; font-size: 14px; line-height: 1.6;">Please register your pets first to receive AI-powered care recommendations.</p>
                    <button onclick="document.getElementById('navPets')?.click()" style="margin-top: 15px; background: linear-gradient(135deg, #7ba05b, #5a7a3f); color: #fff; border: none; padding: 12px 30px; border-radius: 12px; font-weight: 600; cursor: pointer; transition: 0.3s; font-size: 16px;">
                        <i class="fas fa-plus-circle"></i> Add Your Pet
                    </button>
                </div>
            `;
            aiRecommendationsVisible = true;
            if (btn) {
                btn.innerHTML = '<i class="fas fa-eye-slash"></i> Hide Recommendations';
            }
            showToast('<i class="fas fa-info-circle"></i> Register a pet first to get AI recommendations.', 'info');
        }
        
    } catch (error) {
        console.error('Error fetching AI recommendations:', error);
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; background: #ffffff; border-radius: 16px; border: 1px solid #d4e5c4;">
                <div style="font-size: 48px; margin-bottom: 15px; color: #ef4444;"><i class="fas fa-exclamation-triangle"></i></div>
                <h3 style="color: #ef4444; margin-bottom: 10px;">Error Generating Recommendations</h3>
                <p style="color: #4a5a3f; font-size: 14px; line-height: 1.6;">There was a problem generating AI recommendations. Please try again later.</p>
                <button onclick="refreshAIRecommendations()" style="margin-top: 15px; background: linear-gradient(135deg, #7ba05b, #5a7a3f); color: #fff; border: none; padding: 12px 30px; border-radius: 12px; font-weight: 600; cursor: pointer; transition: 0.3s; font-size: 16px;">
                    <i class="fas fa-sync-alt"></i> Try Again
                </button>
            </div>
        `;
        aiRecommendationsVisible = true;
        if (btn) {
            btn.innerHTML = '<i class="fas fa-eye-slash"></i> Hide Recommendations';
        }
        showToast('<i class="fas fa-times-circle"></i> Error getting recommendations. Please try again.', 'error');
    }
}

// ── DOMContentLoaded ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
    sidebar.restoreSidebarState();
    sidebar.switchSection('overview');
    socket.connectSocket();

    const urlParams = new URLSearchParams(window.location.search);
    const fromPayment = urlParams.get('from_payment') === 'success';
    
    if (fromPayment) {
        setTimeout(function() {
            appointments.loadAppointments();
            showToast('<i class="fas fa-check-circle"></i> Payment status updated!', 'success');
            if (window.history && window.history.replaceState) {
                window.history.replaceState({}, document.title, window.location.pathname);
            }
        }, 300);
    }
    
    messages.loadUnreadCount();
    setTimeout(function() { messages.loadUnreadCount(); }, 500);
    
    appointments.loadAppointments();
    pets.loadMyPets();
    messages.loadStaffConversations();
    
    document.querySelectorAll('.appointment-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            appointments.filterAppointments(this.dataset.tab);
        });
    });
    
    const replyInput = document.getElementById('replyMessageStaff');
    if (replyInput) {
        let typingTimer;
        replyInput.addEventListener('input', function() {
            clearTimeout(typingTimer);
            const staffEmail = document.getElementById('replyStaffEmail')?.value;
            if (staffEmail) socket.socketTyping(staffEmail, true);
            typingTimer = setTimeout(() => {
                const staffEmail = document.getElementById('replyStaffEmail')?.value;
                if (staffEmail) socket.socketTyping(staffEmail, false);
            }, 1000);
        });
        replyInput.addEventListener('blur', function() {
            const staffEmail = document.getElementById('replyStaffEmail')?.value;
            if (staffEmail) socket.socketTyping(staffEmail, false);
        });
    }
    
    setTimeout(() => { messages.initEmojiPicker(); }, 500);
    
    const replyForm = document.querySelector('#replyFormStaff');
    if (replyForm) {
        const input = replyForm.querySelector('input[type="text"]');
        const sendBtn = replyForm.querySelector('button[type="submit"]');
        
        if (input && sendBtn && !document.getElementById('customerEmojiBtn')) {
            const btnContainer = document.createElement('div');
            btnContainer.style.cssText = `display: flex; gap: 6px; align-items: center;`;
            
            const emojiBtn = document.createElement('button');
            emojiBtn.id = 'customerEmojiBtn';
            emojiBtn.type = 'button';
            emojiBtn.className = 'reply-action-btn';
            emojiBtn.innerHTML = '<i class="fas fa-smile"></i>';
            emojiBtn.title = 'Insert Emoji';
            emojiBtn.onclick = () => messages.toggleEmojiPicker();
            
            const imageBtn = document.createElement('button');
            imageBtn.id = 'customerImageBtn';
            imageBtn.type = 'button';
            imageBtn.className = 'reply-action-btn';
            imageBtn.innerHTML = '<i class="fas fa-image"></i>';
            imageBtn.title = 'Upload Image';
            imageBtn.onclick = () => {
                import('./messages.js').then(module => {
                    module.showImageUploadModal();
                });
            };
            
            const parent = sendBtn.parentNode;
            parent.insertBefore(btnContainer, sendBtn);
            btnContainer.appendChild(emojiBtn);
            btnContainer.appendChild(imageBtn);
            sendBtn.style.marginLeft = 'auto';
        }
    }
});

window.addEventListener('pageshow', function() {
    appointments.loadAppointments();
    pets.loadMyPets();
    messages.loadStaffConversations();
    messages.loadUnreadCount();
    setTimeout(function() { messages.loadUnreadCount(); }, 500);
});

// ═══════════════════════════════════════════════════════════════════
// ── GLOBAL FUNCTION EXPOSURE ──────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════
window.toggleSidebar = sidebar.toggleSidebar;
window.toggleMobileSidebar = sidebar.toggleMobileSidebar;
window.switchSection = sidebar.switchSection;
window.showLogoutModal = auth.showLogoutModal;
window.closeLogoutModal = auth.closeLogoutModal;
window.confirmLogout = auth.confirmLogout;
window.showToast = showToast;
window.formatDuration = formatDuration;
window.formatTime = formatTime;

window.showAppointmentDetails = appointments.showAppointmentDetails;
window.cancelAppointment = appointments.cancelAppointment;
window.filterAppointments = appointments.filterAppointments;

window.loadMyPets = pets.loadMyPets;
window.showAddPetModal = pets.showAddPetModal;
window.closeAddPetModal = pets.closeAddPetModal;
window.submitNewPet = pets.submitNewPet;
window.previewAddPetImage = pets.previewAddPetImage;
window.showEditPetDetailsModal = pets.showEditPetDetailsModal;
window.closeEditPetDetailsModal = pets.closeEditPetDetailsModal;
window.updatePetDetails = pets.updatePetDetails;
window.deletePet = pets.deletePet;
window.showEditPetImageModal = pets.showEditPetImageModal;
window.closeEditPetImageModal = pets.closeEditPetImageModal;
window.submitPetImageUpdate = pets.submitPetImageUpdate;
window.previewEditPetImage2 = pets.previewEditPetImage2;

window.loadStaffConversations = messages.loadStaffConversations;
window.loadCustomerConversation = messages.loadCustomerConversation;
window.loadFirstUnreadConversation = messages.loadFirstUnreadConversation;
window.sendCustomerReply = messages.sendCustomerReply;
window.loadUnreadCount = messages.loadUnreadCount;
window.updateMessageBadge = messages.updateMessageBadge;
window.showContactModal = messages.showContactModal;
window.closeContactModal = messages.closeContactModal;
window.sendMessage = messages.sendMessage;

window.toggleEmojiPicker = messages.toggleEmojiPicker;
window.insertEmoji = messages.insertEmoji;
window.showImageUploadModal = messages.showImageUploadModal;
window.closeImageUploadModal = messages.closeImageUploadModal;
window.sendImageMessage = messages.sendImageMessage;
window.openImageFullscreen = messages.openImageFullscreen;
window.initEmojiPicker = messages.initEmojiPicker;

window.renderDatePicker = datepicker.renderDatePicker;
window.changeMonth = datepicker.changeMonth;
window.selectToday = datepicker.selectToday;
window.selectDate = datepicker.selectDate;
window.selectTime = datepicker.selectTime;
window.loadTimeSlots = datepicker.loadTimeSlots;

window.showBookAppointmentModal = modals.showBookAppointmentModal;
window.closeBookAppointmentModal = modals.closeBookAppointmentModal;
window.submitAppointment = modals.submitAppointment;
window.showBookingConfirmation = modals.showBookingConfirmation;
window.closeBookingConfirmation = modals.closeBookingConfirmation;
window.confirmBooking = modals.confirmBooking;

window.refreshAIRecommendations = refreshAIRecommendations;
window.regeneratePetRecommendation = regeneratePetRecommendation;
window.closeRegenerateConfirmModal = closeRegenerateConfirmModal;
window.executeRegenerate = executeRegenerate;

(function initSocket() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            socket.connectSocket();
            messages.loadUnreadCount();
        });
    } else {
        socket.connectSocket();
        messages.loadUnreadCount();
    }
})();