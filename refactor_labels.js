const fs = require('fs');
const path = require('path');

const targetFiles = [
  'src/app/modules/booking/views/booking.html',
  'src/app/modules/booking/views/booking-dialog.html',
  'src/app/modules/customers/views/vehicle-dialog.html',
  'src/app/modules/finance/views/finance.html',
  'src/app/modules/finance/views/expense-dialog.html',
  'src/app/modules/inventory/views/inventory.html',
  'src/app/modules/inventory/views/product-dialog.html',
  'src/app/modules/inventory/views/restock-dialog.html',
  'src/app/modules/portal/views/portal-vehicle-dialog.html',
  'src/app/modules/user-access/views/user-access.html',
  'src/app/modules/user-access/views/user-dialog.html',
  'src/app/modules/work-order/views/work-order.html',
  'src/app/modules/work-order/views/estimate-dialog.html'
];

// We need to parse safely. Regex might fail if there are nested mat-form-fields (which shouldn't happen).
const regex = /([ \t]*)(<mat-form-field[^>]*>)([\s\S]*?)<mat-label>([\s\S]*?)<\/mat-label>([\s\S]*?)<\/mat-form-field>/g;

let totalMatches = 0;

for (const file of targetFiles) {
  const fullPath = path.join(__dirname, file);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Some files might have multiple <mat-label> inside a single mat-form-field? Unlikely, but possible.
    // Also, the regex `[\s\S]*?` is lazy, so it will match the first <mat-label> and then the NEXT </mat-form-field>.
    // This could fail if there are multiple <mat-form-field> back-to-back and one doesn't have a <mat-label>.
    // To fix this, we should NOT match </mat-form-field> inside [\s\S]*?.
    // Instead of [\s\S]*?, use a pattern that doesn't match </mat-form-field>.
    // Wait, regex might be too fragile. Let's use a simple state machine or a better regex:
    
    let modified = true;
    let count = 0;
    while (modified) {
      modified = false;
      content = content.replace(/([ \t]*)(<mat-form-field[^>]*>)((?:(?!<\/mat-form-field>)[\s\S])*?)<mat-label>([\s\S]*?)<\/mat-label>((?:(?!<\/mat-form-field>)[\s\S])*?)<\/mat-form-field>/g, 
        (match, indent, openTag, beforeLabel, labelContent, afterLabel) => {
          modified = true;
          count++;
          return `${indent}<div class="form-col-wrapper">\n${indent}  <label class="form-label-static">${labelContent.trim()}</label>\n${indent}  ${openTag}${beforeLabel}${afterLabel}</mat-form-field>\n${indent}</div>`;
      });
    }
    
    if (count > 0) {
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`Refactored ${count} fields in ${file}`);
      totalMatches += count;
    } else {
      console.log(`No fields refactored in ${file} (already done or none exist)`);
    }
  } else {
    console.log(`File not found: ${file}`);
  }
}

console.log(`Total fields refactored: ${totalMatches}`);
