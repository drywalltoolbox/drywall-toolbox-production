#!/usr/bin/env python3
"""
Production-Grade Catalog Brand Audit & Cleanup Tool
Removes non-authorized brands from drywall-toolbox products catalog
"""

import csv
import json
from pathlib import Path
from collections import defaultdict, Counter
from datetime import datetime
from typing import List, Dict, Set, Tuple

# Authorized brands for the catalog
# NOTE: Exact brand names as they appear in the CSV
AUTHORIZED_BRANDS = {
    'tapetech',              # TapeTech
    'columbia taping tools', # Columbia Taping Tools
    'surpro',                # SurPro
    'asgard',                # Asgard
    'graco'                  # Graco
}

class CatalogBrandAuditor:
    """Comprehensive catalog brand auditor and cleaner"""
    
    def __init__(self, csv_path: str):
        self.csv_path = Path(csv_path)
        self.products: List[Dict] = []
        self.brand_stats: Dict[str, int] = defaultdict(int)
        self.authorized_products: List[Dict] = []
        self.unauthorized_products: List[Dict] = []
        self.cleanup_report = {
            'timestamp': datetime.now().isoformat(),
            'original_file': str(csv_path),
            'total_products_analyzed': 0,
            'authorized_products_kept': 0,
            'unauthorized_products_removed': 0,
            'authorized_brands': list(AUTHORIZED_BRANDS),
            'brands_distribution': {},
            'unauthorized_brands_found': [],
            'removed_products_by_brand': {},
            'details': []
        }
    
    def load_catalog(self) -> bool:
        """Load the CSV catalog"""
        try:
            with open(self.csv_path, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                self.products = list(reader)
            
            self.cleanup_report['total_products_analyzed'] = len(self.products)
            print(f"✓ Loaded {len(self.products)} products from catalog")
            return True
        except Exception as e:
            print(f"✗ Error loading catalog: {e}")
            return False
    
    def _normalize_brand(self, brand: str) -> str:
        """Normalize brand name for comparison (lowercase only, keep spaces)"""
        return brand.lower().strip()
    
    def audit_brands(self):
        """Audit all brands in the catalog"""
        print("\n" + "=" * 80)
        print("BRAND AUDIT - ANALYZING ALL BRANDS")
        print("=" * 80)
        
        # Count all brands
        for product in self.products:
            brand = product.get('brand', '').strip()
            self.brand_stats[brand] += 1
        
        # Categorize products
        for idx, product in enumerate(self.products, start=1):
            brand = product.get('brand', '').strip()
            normalized_brand = self._normalize_brand(brand)
            
            if normalized_brand in AUTHORIZED_BRANDS:
                self.authorized_products.append((idx, product))
            else:
                self.unauthorized_products.append((idx, product))
                if brand not in self.cleanup_report['removed_products_by_brand']:
                    self.cleanup_report['removed_products_by_brand'][brand] = []
                self.cleanup_report['removed_products_by_brand'][brand].append({
                    'row': idx,
                    'name': product.get('name', 'N/A'),
                    'sku': product.get('sku', 'N/A'),
                    'price': product.get('price', 'N/A')
                })
        
        # Update report
        self.cleanup_report['authorized_products_kept'] = len(self.authorized_products)
        self.cleanup_report['unauthorized_products_removed'] = len(self.unauthorized_products)
        
        # Build brand distribution
        for brand, count in sorted(self.brand_stats.items(), key=lambda x: x[1], reverse=True):
            normalized = self._normalize_brand(brand)
            is_authorized = normalized in AUTHORIZED_BRANDS
            self.cleanup_report['brands_distribution'][brand] = {
                'count': count,
                'authorized': is_authorized,
                'status': '✓ KEEP' if is_authorized else '✗ REMOVE'
            }
            
            if not is_authorized:
                self.cleanup_report['unauthorized_brands_found'].append(brand)
    
    def print_audit_report(self):
        """Print detailed audit report"""
        print("\n" + "=" * 80)
        print("BRAND DISTRIBUTION REPORT")
        print("=" * 80)
        
        print("\n📊 AUTHORIZED BRANDS (to keep):")
        auth_count = 0
        for brand, stats in sorted(self.cleanup_report['brands_distribution'].items()):
            if stats['authorized']:
                print(f"  ✓ {brand:30s} → {stats['count']:4d} products")
                auth_count += stats['count']
        print(f"\n  Total Authorized: {auth_count} products")
        
        print("\n❌ UNAUTHORIZED BRANDS (to remove):")
        unauth_count = 0
        for brand, stats in sorted(self.cleanup_report['brands_distribution'].items()):
            if not stats['authorized']:
                print(f"  ✗ {brand:30s} → {stats['count']:4d} products")
                unauth_count += stats['count']
        print(f"\n  Total Unauthorized: {unauth_count} products")
        
        print("\n" + "=" * 80)
        print("SUMMARY")
        print("=" * 80)
        print(f"Total Products in Catalog:     {self.cleanup_report['total_products_analyzed']}")
        print(f"Authorized Brands:              {len([b for b in self.cleanup_report['brands_distribution'].values() if b['authorized']])}")
        print(f"Unauthorized Brands:            {len(self.cleanup_report['unauthorized_brands_found'])}")
        print(f"Products to KEEP:               {self.cleanup_report['authorized_products_kept']}")
        print(f"Products to REMOVE:             {self.cleanup_report['unauthorized_products_removed']}")
        print(f"Removal Percentage:             {(self.cleanup_report['unauthorized_products_removed'] / self.cleanup_report['total_products_analyzed'] * 100):.2f}%")
        print("=" * 80)
    
    def print_removal_details(self):
        """Print details of products being removed"""
        if not self.unauthorized_products:
            print("\n✓ No unauthorized products found!")
            return
        
        print("\n" + "=" * 80)
        print("PRODUCTS TO BE REMOVED (by brand)")
        print("=" * 80)
        
        for brand in sorted(self.cleanup_report['removed_products_by_brand'].keys()):
            products = self.cleanup_report['removed_products_by_brand'][brand]
            print(f"\n❌ BRAND: {brand} ({len(products)} products)")
            print("   " + "-" * 76)
            
            for product in products[:10]:  # Show first 10
                print(f"   Row {product['row']:4d} | SKU: {product['sku']:15s} | {product['name'][:50]}")
            
            if len(products) > 10:
                print(f"   ... and {len(products) - 10} more products from this brand")
    
    def create_cleaned_catalog(self, output_path: str = None) -> str:
        """Create cleaned catalog with only authorized brands"""
        if output_path is None:
            output_path = self.csv_path.parent / f"products_catalog_CLEANED_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        else:
            output_path = Path(output_path)
        
        try:
            with open(self.csv_path, 'r', encoding='utf-8') as infile:
                reader = csv.DictReader(infile)
                fieldnames = reader.fieldnames
                
                with open(output_path, 'w', encoding='utf-8', newline='') as outfile:
                    writer = csv.DictWriter(outfile, fieldnames=fieldnames)
                    writer.writeheader()
                    
                    for row in reader:
                        brand = row.get('brand', '').strip()
                        normalized_brand = self._normalize_brand(brand)
                        
                        if normalized_brand in AUTHORIZED_BRANDS:
                            writer.writerow(row)
            
            print(f"\n✓ Cleaned catalog created: {output_path}")
            return str(output_path)
        except Exception as e:
            print(f"✗ Error creating cleaned catalog: {e}")
            return None
    
    def save_cleanup_report(self, output_file: str = None) -> str:
        """Save detailed cleanup report as JSON"""
        if output_file is None:
            output_file = self.csv_path.parent / f"brand_cleanup_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        else:
            output_file = Path(output_file)
        
        try:
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(self.cleanup_report, f, indent=2, ensure_ascii=False)
            
            print(f"✓ Cleanup report saved: {output_file}")
            return str(output_file)
        except Exception as e:
            print(f"✗ Error saving report: {e}")
            return None
    
    def audit(self):
        """Run complete audit"""
        print("=" * 80)
        print("PRODUCTION-GRADE CATALOG BRAND AUDIT & CLEANUP")
        print("=" * 80)
        print(f"Analysis started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        if not self.load_catalog():
            return False
        
        self.audit_brands()
        return True


def main():
    """Main entry point"""
    catalog_path = "d:\\AMD\\projects\\drywall-toolbox\\public\\products_catalog.csv"
    
    auditor = CatalogBrandAuditor(catalog_path)
    
    if not auditor.audit():
        print("Audit failed!")
        return 1
    
    # Print console reports
    auditor.print_audit_report()
    auditor.print_removal_details()
    
    # Save JSON report
    auditor.save_cleanup_report()
    
    # Ask for confirmation before cleaning
    print("\n" + "=" * 80)
    print("CLEANUP CONFIRMATION")
    print("=" * 80)
    print(f"About to remove {auditor.cleanup_report['unauthorized_products_removed']} products")
    print(f"from {auditor.cleanup_report['unauthorized_brands_found']} unauthorized brands")
    print("=" * 80)
    
    response = input("\nCreate cleaned catalog? (yes/no): ").strip().lower()
    
    if response in ['yes', 'y']:
        cleaned_path = auditor.create_cleaned_catalog()
        print(f"\n✓ Cleaned catalog ready at: {cleaned_path}")
        print("⚠️  Review the cleaned catalog before replacing the original!")
    else:
        print("\n✗ Cleanup cancelled - no changes made")
    
    return 0


if __name__ == "__main__":
    import sys
    sys.exit(main())
