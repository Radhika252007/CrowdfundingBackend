// Utility functions for generating custom IDs

import Admin from '../models/Admin.js';
import Campaign from '../models/Campaign.js';
import Donation from '../models/Donation.js';
import CampaignImage from '../models/CampaignImage.js';
import CampaignFile from '../models/CampaignFile.js';
import Beneficiary from '../models/Beneficiary.js';
import Update from '../models/Update.js';
import CampaignComment from '../models/CampaignComment.js';
import CampaignShare from '../models/CampaignShare.js';

/**
 * Generate next Campaign ID
 * Format: CMP001, CMP002, ...
 */
export async function getNextCampaignId() {
  const last = await Campaign.findOne().sort({ campaign_id: -1 });
  if (!last) return 'CMP001';
  const num = parseInt(last.campaign_id.replace('CMP', '')) + 1;
  return 'CMP' + num.toString().padStart(3, '0');
}

/**
 * Generate next Donation ID
 * Format: DON001, DON002, ...
 */
export async function getNextDonationId() {
  const last = await Donation.findOne().sort({ donation_id: -1 }).lean();
  if (!last) return 'DON001';
  const num = parseInt(last.donation_id.replace('DON', '')) + 1;
  return 'DON' + num.toString().padStart(3, '0');
}

/**
 * Generate next Image ID
 * Format: IMG001, IMG002, ...
 */
export async function getNextImageId() {
  const last = await CampaignImage.findOne().sort({ image_id: -1 });
  if (!last) return 'IMG001';
  const num = parseInt(last.image_id.replace('IMG', '')) + 1;
  return 'IMG' + num.toString().padStart(3, '0');
}

/**
 * Generate next File ID
 * Format: FILE001, FILE002, ...
 */
export async function getNextFileId() {
  const last = await CampaignFile.findOne().sort({ file_id: -1 });
  if (!last) return 'FILE001';
  const num = parseInt(last.file_id.replace('FILE', '')) + 1;
  return 'FILE' + num.toString().padStart(3, '0');
}

/**
 * Generate next Beneficiary ID
 * Format: BEN001, BEN002, ...
 */
export async function getNextBeneficiaryId() {
  const last = await Beneficiary.findOne().sort({ beneficiary_id: -1 });
  if (!last) return 'BEN001';
  const num = parseInt(last.beneficiary_id.replace('BEN', '')) + 1;
  return 'BEN' + num.toString().padStart(3, '0');
}

/**
 * Generate next Update ID
 * Format: UPD001, UPD002, ...
 */
export async function getNextUpdateId() {
  const last = await Update.findOne().sort({ _id: -1 }).lean();
  const lastId = last ? last.update_id : 'UPD000';
  const num = parseInt(lastId.replace('UPD', '')) + 1;
  return 'UPD' + num.toString().padStart(3, '0');
}

/**
 * Generate next Comment ID
 * Format: COM001, COM002, ...
 */
export async function getNextCommentId() {
  const last = await CampaignComment.findOne().sort({ _id: -1 }).lean();
  const lastId = last ? last.comment_id : 'COM000';
  const num = parseInt(lastId.replace('COM', '')) + 1;
  return 'COM' + num.toString().padStart(3, '0');
}

/**
 * Generate next Share ID
 * Format: SH001, SH002, ...
 */
export async function getNextShareId() {
  const last = await CampaignShare.findOne().sort({ _id: -1 }).lean();
  const lastId = last ? last.share_id : 'SH000';
  const num = parseInt(lastId.replace('SH', '')) + 1;
  return 'SH' + num.toString().padStart(3, '0');
}

/**
 * Generate next Admin ID
 * Format: ADM001, ADM002, ...
 */
export async function generateAdminId() {
  const count = await Admin.countDocuments();
  const nextId = count + 1;
  return 'ADM' + String(nextId).padStart(3, '0');
}

/**
 * Assign admin in round-robin fashion
 */
export async function assignAdminRoundRobin() {
  const admins = await Admin.find().sort({ admin_id: 1 });
  const lastCampaign = await Campaign.findOne().sort({ campaign_id: -1 });

  if (!lastCampaign) return admins[0].admin_id;

  const currentIndex = admins.findIndex(
    (a) => a.admin_id === lastCampaign.admin_id
  );

  return admins[(currentIndex + 1) % admins.length].admin_id;
}
