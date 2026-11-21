import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export interface SubscriptionPackage {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  durationDays: number;
  durationType: 'DAYS' | 'MONTHS' | 'YEARS';
  durationValue: number;
  features: string[];
  isPopular: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const DEFAULT_PACKAGES: SubscriptionPackage[] = [
  {
    id: 1,
    name: 'Starter Plan',
    slug: 'starter',
    description: 'Essential tools for individual builders and basic land layout planning.',
    price: 4999,
    durationDays: 30,
    durationType: 'MONTHS',
    durationValue: 1,
    features: [
      'Up to 5 CAD Layout Projects',
      'DXF & DWG Vector Conversion',
      'Interactive Plot Mapping',
      'Public Project Link Sharing',
      'Standard Email Support',
    ],
    isPopular: false,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 2,
    name: 'Professional Plan',
    slug: 'professional',
    description: 'Complete CAD and land layout mapping suite for estate brokers and developers.',
    price: 39999,
    durationDays: 365,
    durationType: 'YEARS',
    durationValue: 1,
    features: [
      'Unlimited CAD Layout Projects',
      'High-Precision Boundary & Plot Snapping',
      'Amenity Placement & Custom Icons',
      'Plot Status Management (Available/Sold/Booked)',
      'High-Resolution PDF & Print Export',
      'Priority Phone & WhatsApp Support',
    ],
    isPopular: true,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 3,
    name: 'Enterprise Plan',
    slug: 'enterprise',
    description: 'Advanced capabilities for real estate firms requiring multi-seat access and custom workflows.',
    price: 89999,
    durationDays: 730,
    durationType: 'YEARS',
    durationValue: 2,
    features: [
      'All Professional Features Included',
      'Multi-User Team Sub-Accounts',
      'Custom AutoCAD DWG Layer Presets',
      'Custom Branding & White-Labeling',
      'Dedicated Technical Account Manager',
      '24/7 Priority Support SLA',
    ],
    isPopular: false,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

@Injectable()
export class SubscriptionPackagesService {
  private filePath: string;
  private packages: SubscriptionPackage[] = [];

  constructor() {
    const dataDir = path.resolve(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      try {
        fs.mkdirSync(dataDir, { recursive: true });
      } catch (e) {
        // ignore
      }
    }
    this.filePath = path.join(dataDir, 'subscription-packages.json');
    this.loadPackages();
  }

  private loadPackages() {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf8');
        this.packages = JSON.parse(raw);
      } else {
        this.packages = DEFAULT_PACKAGES;
        this.savePackages();
      }
    } catch (e) {
      this.packages = DEFAULT_PACKAGES;
    }
  }

  private savePackages() {
    try {
      const dataDir = path.dirname(this.filePath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      fs.writeFileSync(this.filePath, JSON.stringify(this.packages, null, 2), 'utf8');
    } catch (e) {
      console.error('Failed to save subscription packages to file', e);
    }
  }

  findAll(activeOnly: boolean = false): SubscriptionPackage[] {
    if (activeOnly) {
      return this.packages.filter((p) => p.isActive);
    }
    return this.packages;
  }

  findById(id: number): SubscriptionPackage {
    const pkg = this.packages.find((p) => p.id === id);
    if (!pkg) throw new NotFoundException('Subscription package not found');
    return pkg;
  }

  create(data: {
    name: string;
    description?: string;
    price: number;
    durationDays?: number;
    durationType?: 'DAYS' | 'MONTHS' | 'YEARS';
    durationValue?: number;
    features?: string[];
    isPopular?: boolean;
    isActive?: boolean;
  }): SubscriptionPackage {
    if (!data.name) throw new BadRequestException('Package name is required');

    let durationDays = data.durationDays || 30;
    const durationType = data.durationType || 'MONTHS';
    const durationValue = data.durationValue || 1;

    if (!data.durationDays && durationValue) {
      if (durationType === 'DAYS') durationDays = durationValue;
      else if (durationType === 'MONTHS') durationDays = durationValue * 30;
      else if (durationType === 'YEARS') durationDays = durationValue * 365;
    }

    const nextId = this.packages.length > 0 ? Math.max(...this.packages.map((p) => p.id)) + 1 : 1;
    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const newPkg: SubscriptionPackage = {
      id: nextId,
      name: data.name,
      slug,
      description: data.description || '',
      price: Number(data.price) || 0,
      durationDays,
      durationType,
      durationValue,
      features: Array.isArray(data.features) ? data.features.filter(Boolean) : [],
      isPopular: Boolean(data.isPopular),
      isActive: data.isActive !== false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.packages.push(newPkg);
    this.savePackages();
    return newPkg;
  }

  update(
    id: number,
    data: {
      name?: string;
      description?: string;
      price?: number;
      durationDays?: number;
      durationType?: 'DAYS' | 'MONTHS' | 'YEARS';
      durationValue?: number;
      features?: string[];
      isPopular?: boolean;
      isActive?: boolean;
    }
  ): SubscriptionPackage {
    const index = this.packages.findIndex((p) => p.id === id);
    if (index === -1) throw new NotFoundException('Subscription package not found');

    const existing = this.packages[index];

    let durationDays = data.durationDays || existing.durationDays;
    const durationType = data.durationType || existing.durationType;
    const durationValue = data.durationValue !== undefined ? data.durationValue : existing.durationValue;

    if (data.durationValue && !data.durationDays) {
      if (durationType === 'DAYS') durationDays = durationValue;
      else if (durationType === 'MONTHS') durationDays = durationValue * 30;
      else if (durationType === 'YEARS') durationDays = durationValue * 365;
    }

    const updated: SubscriptionPackage = {
      ...existing,
      name: data.name ?? existing.name,
      description: data.description ?? existing.description,
      price: data.price !== undefined ? Number(data.price) : existing.price,
      durationDays,
      durationType,
      durationValue,
      features: Array.isArray(data.features) ? data.features.filter(Boolean) : existing.features,
      isPopular: data.isPopular !== undefined ? Boolean(data.isPopular) : existing.isPopular,
      isActive: data.isActive !== undefined ? Boolean(data.isActive) : existing.isActive,
      updatedAt: new Date().toISOString(),
    };

    this.packages[index] = updated;
    this.savePackages();
    return updated;
  }

  delete(id: number): { message: string } {
    const index = this.packages.findIndex((p) => p.id === id);
    if (index === -1) throw new NotFoundException('Subscription package not found');

    this.packages.splice(index, 1);
    this.savePackages();
    return { message: 'Package deleted successfully' };
  }
}
