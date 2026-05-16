import {
  buildCsvReport,
  buildExcelReport,
  buildPdfReport,
} from '../services/reportService.js';
import { AppError } from '../utils/AppError.js';

const ranges = new Set(['daily', 'weekly', 'monthly']);

export async function csv(req, res) {
  const range = req.params.range || req.query.range || 'daily';
  if (!ranges.has(range)) throw new AppError('Invalid range', 400);
  const { filename, mime, body } = await buildCsvReport(req.user._id, range);
  res.setHeader('Content-Type', mime);
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(body);
}

export async function excel(req, res) {
  const range = req.params.range || req.query.range || 'daily';
  if (!ranges.has(range)) throw new AppError('Invalid range', 400);
  const { filename, mime, body } = await buildExcelReport(req.user._id, range);
  res.setHeader('Content-Type', mime);
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(body);
}

export async function pdf(req, res) {
  const range = req.params.range || req.query.range || 'daily';
  if (!ranges.has(range)) throw new AppError('Invalid range', 400);
  const { filename, mime, body } = await buildPdfReport(req.user._id, range);
  res.setHeader('Content-Type', mime);
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(body);
}
