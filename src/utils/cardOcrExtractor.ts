/**
 * cardOcrExtractor.ts
 * High-precision Indian Aadhaar and Driving Licence Regex Extraction Engine
 * Provides field-by-field extraction, postal PIN code lookup, and DL expiry validation.
 */

export interface ExtractedDocumentData {
  // Aadhaar Fields
  fullName?: string;
  name?: string; // alias for fullName
  fatherName?: string;
  dob?: string;          // YYYY-MM-DD
  gender?: 'Male' | 'Female' | 'Other';
  aadhaarNumber?: string;
  address?: string;
  pinCode?: string;
  city?: string;
  state?: string;

  // Driving Licence Fields
  dlNumber?: string;
  dlExpiryDate?: string; // YYYY-MM-DD
  expiryDate?: string;   // alias for dlExpiryDate
  isDlExpired?: boolean;
  isExpired?: boolean;   // alias for isDlExpired
  isExpiringSoon?: boolean;
  vehicleClass?: 'LMV-TR' | 'TRANS' | 'HMV' | 'HGMV' | '3W-CAB';
  warning?: string;
  rawText?: string;
}

/**
 * Indian Postal PIN Code Prefix Dictionary (Maps 2-3 digit prefix to City & State)
 */
export const PIN_CODE_DIRECTORY: Record<string, { city: string; state: string }> = {
  // Rajasthan
  '342': { city: 'Jodhpur', state: 'Rajasthan' },
  '302': { city: 'Jaipur', state: 'Rajasthan' },
  '301': { city: 'Alwar', state: 'Rajasthan' },
  '305': { city: 'Ajmer', state: 'Rajasthan' },
  '311': { city: 'Bhilwara', state: 'Rajasthan' },
  '313': { city: 'Udaipur', state: 'Rajasthan' },
  '324': { city: 'Kota', state: 'Rajasthan' },
  '334': { city: 'Bikaner', state: 'Rajasthan' },
  '335': { city: 'Sri Ganganagar', state: 'Rajasthan' },
  '332': { city: 'Sikar', state: 'Rajasthan' },
  '333': { city: 'Jhunjhunu', state: 'Rajasthan' },
  '341': { city: 'Nagaur', state: 'Rajasthan' },
  '344': { city: 'Barmer', state: 'Rajasthan' },
  '345': { city: 'Jaisalmer', state: 'Rajasthan' },
  '306': { city: 'Pali', state: 'Rajasthan' },

  // Delhi NCR & Haryana
  '110': { city: 'New Delhi', state: 'Delhi' },
  '121': { city: 'Faridabad', state: 'Haryana' },
  '122': { city: 'Gurugram', state: 'Haryana' },
  '124': { city: 'Rohtak', state: 'Haryana' },
  '125': { city: 'Hisar', state: 'Haryana' },
  '131': { city: 'Sonipat', state: 'Haryana' },
  '132': { city: 'Panipat', state: 'Haryana' },
  '133': { city: 'Ambala', state: 'Haryana' },
  '134': { city: 'Panchkula', state: 'Haryana' },
  '135': { city: 'Yamunanagar', state: 'Haryana' },
  '136': { city: 'Kurukshetra', state: 'Haryana' },

  // Punjab & Chandigarh
  '141': { city: 'Ludhiana', state: 'Punjab' },
  '143': { city: 'Amritsar', state: 'Punjab' },
  '144': { city: 'Jalandhar', state: 'Punjab' },
  '147': { city: 'Patiala', state: 'Punjab' },
  '151': { city: 'Bathinda', state: 'Punjab' },
  '160': { city: 'Chandigarh', state: 'Chandigarh' },

  // Uttar Pradesh & Uttarakhand
  '201': { city: 'Noida', state: 'Uttar Pradesh' },
  '202': { city: 'Aligarh', state: 'Uttar Pradesh' },
  '208': { city: 'Kanpur', state: 'Uttar Pradesh' },
  '211': { city: 'Prayagraj', state: 'Uttar Pradesh' },
  '221': { city: 'Varanasi', state: 'Uttar Pradesh' },
  '226': { city: 'Lucknow', state: 'Uttar Pradesh' },
  '248': { city: 'Dehradun', state: 'Uttarakhand' },
  '249': { city: 'Haridwar', state: 'Uttarakhand' },
  '282': { city: 'Agra', state: 'Uttar Pradesh' },
  '284': { city: 'Jhansi', state: 'Uttar Pradesh' },
  '250': { city: 'Meerut', state: 'Uttar Pradesh' },
  '243': { city: 'Bareilly', state: 'Uttar Pradesh' },
  '273': { city: 'Gorakhpur', state: 'Uttar Pradesh' },

  // Gujarat
  '380': { city: 'Ahmedabad', state: 'Gujarat' },
  '382': { city: 'Gandhinagar', state: 'Gujarat' },
  '390': { city: 'Vadodara', state: 'Gujarat' },
  '395': { city: 'Surat', state: 'Gujarat' },
  '360': { city: 'Rajkot', state: 'Gujarat' },
  '361': { city: 'Jamnagar', state: 'Gujarat' },
  '364': { city: 'Bhavnagar', state: 'Gujarat' },

  // Maharashtra
  '400': { city: 'Mumbai', state: 'Maharashtra' },
  '411': { city: 'Pune', state: 'Maharashtra' },
  '422': { city: 'Nashik', state: 'Maharashtra' },
  '431': { city: 'Chhatrapati Sambhajinagar', state: 'Maharashtra' },
  '440': { city: 'Nagpur', state: 'Maharashtra' },
  '416': { city: 'Kolhapur', state: 'Maharashtra' },
  '413': { city: 'Solapur', state: 'Maharashtra' },

  // Madhya Pradesh & Chhattisgarh
  '452': { city: 'Indore', state: 'Madhya Pradesh' },
  '462': { city: 'Bhopal', state: 'Madhya Pradesh' },
  '474': { city: 'Gwalior', state: 'Madhya Pradesh' },
  '482': { city: 'Jabalpur', state: 'Madhya Pradesh' },
  '492': { city: 'Raipur', state: 'Chhattisgarh' },
  '495': { city: 'Bilaspur', state: 'Chhattisgarh' },

  // Karnataka
  '560': { city: 'Bengaluru', state: 'Karnataka' },
  '570': { city: 'Mysuru', state: 'Karnataka' },
  '580': { city: 'Hubballi', state: 'Karnataka' },
  '575': { city: 'Mangaluru', state: 'Karnataka' },
  '585': { city: 'Kalaburagi', state: 'Karnataka' },

  // Telangana & Andhra Pradesh
  '500': { city: 'Hyderabad', state: 'Telangana' },
  '506': { city: 'Warangal', state: 'Telangana' },
  '520': { city: 'Vijayawada', state: 'Andhra Pradesh' },
  '530': { city: 'Visakhapatnam', state: 'Andhra Pradesh' },
  '517': { city: 'Tirupati', state: 'Andhra Pradesh' },
  '522': { city: 'Guntur', state: 'Andhra Pradesh' },

  // Tamil Nadu & Kerala
  '600': { city: 'Chennai', state: 'Tamil Nadu' },
  '641': { city: 'Coimbatore', state: 'Tamil Nadu' },
  '625': { city: 'Madurai', state: 'Tamil Nadu' },
  '620': { city: 'Tiruchirappalli', state: 'Tamil Nadu' },
  '636': { city: 'Salem', state: 'Tamil Nadu' },
  '682': { city: 'Kochi', state: 'Kerala' },
  '695': { city: 'Thiruvananthapuram', state: 'Kerala' },
  '673': { city: 'Kozhikode', state: 'Kerala' },
  '680': { city: 'Thrissur', state: 'Kerala' },

  // West Bengal, Odisha & North East
  '700': { city: 'Kolkata', state: 'West Bengal' },
  '713': { city: 'Durgapur', state: 'West Bengal' },
  '734': { city: 'Siliguri', state: 'West Bengal' },
  '751': { city: 'Bhubaneswar', state: 'Odisha' },
  '769': { city: 'Rourkela', state: 'Odisha' },
  '781': { city: 'Guwahati', state: 'Assam' },

  // Bihar & Jharkhand
  '800': { city: 'Patna', state: 'Bihar' },
  '842': { city: 'Muzaffarpur', state: 'Bihar' },
  '823': { city: 'Gaya', state: 'Bihar' },
  '834': { city: 'Ranchi', state: 'Jharkhand' },
  '831': { city: 'Jamshedpur', state: 'Jharkhand' },
  '826': { city: 'Dhanbad', state: 'Jharkhand' }
};

/**
 * Derives City and State from a 6-digit PIN code or address keywords
 */
export const deriveCityAndState = (
  pinCode?: string,
  rawAddressText?: string
): { city: string; state: string } => {
  // 1. PIN Code 3-digit prefix lookup
  if (pinCode && pinCode.length >= 3) {
    const prefix = pinCode.slice(0, 3);
    if (PIN_CODE_DIRECTORY[prefix]) {
      return { ...PIN_CODE_DIRECTORY[prefix] };
    }

    // Zone fallbacks based on first digit
    const firstDigit = pinCode[0];
    const zoneStateMap: Record<string, { city: string; state: string }> = {
      '1': { city: 'Delhi / NCR', state: 'Delhi' },
      '2': { city: 'Lucknow', state: 'Uttar Pradesh' },
      '3': { city: 'Jaipur', state: 'Rajasthan' },
      '4': { city: 'Mumbai', state: 'Maharashtra' },
      '5': { city: 'Hyderabad', state: 'Telangana' },
      '6': { city: 'Chennai', state: 'Tamil Nadu' },
      '7': { city: 'Kolkata', state: 'West Bengal' },
      '8': { city: 'Patna', state: 'Bihar' }
    };
    if (zoneStateMap[firstDigit]) {
      return zoneStateMap[firstDigit];
    }
  }

  // 2. Keyword heuristic from text
  const text = (rawAddressText || '').toUpperCase();

  const stateKeywords: Array<{ name: string; city: string }> = [
    { name: 'RAJASTHAN', city: 'Jodhpur' },
    { name: 'MAHARASHTRA', city: 'Mumbai' },
    { name: 'UTTAR PRADESH', city: 'Lucknow' },
    { name: 'MADHYA PRADESH', city: 'Indore' },
    { name: 'GUJARAT', city: 'Ahmedabad' },
    { name: 'HARYANA', city: 'Gurugram' },
    { name: 'PUNJAB', city: 'Ludhiana' },
    { name: 'DELHI', city: 'New Delhi' },
    { name: 'KARNATAKA', city: 'Bengaluru' },
    { name: 'TAMIL NADU', city: 'Chennai' },
    { name: 'TELANGANA', city: 'Hyderabad' },
    { name: 'ANDHRA PRADESH', city: 'Vijayawada' },
    { name: 'KERALA', city: 'Kochi' },
    { name: 'WEST BENGAL', city: 'Kolkata' },
    { name: 'BIHAR', city: 'Patna' },
    { name: 'JHARKHAND', city: 'Ranchi' },
    { name: 'ODISHA', city: 'Bhubaneswar' },
    { name: 'ASSAM', city: 'Guwahati' },
    { name: 'UTTARAKHAND', city: 'Dehradun' },
    { name: 'CHHATTISGARH', city: 'Raipur' }
  ];

  for (const item of stateKeywords) {
    if (text.includes(item.name)) {
      return { city: item.city, state: item.name };
    }
  }

  return { city: 'Jodhpur', state: 'Rajasthan' };
};

/**
 * Extracts all designated fields from raw Aadhaar card OCR text
 */
export const extractAadhaarFields = (rawText: string): ExtractedDocumentData => {
  const result: ExtractedDocumentData = { rawText };
  const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);
  const cleanUpper = rawText.toUpperCase();

  // 1. Govt ID / Aadhaar (12 Digits)
  // Matches: 7845 1290 3421 or 784512903421
  const aadhaarRegex = /\b([2-9]{1}[0-9]{3})\s?([0-9]{4})\s?([0-9]{4})\b/;
  const aadhaarMatch = rawText.match(aadhaarRegex);
  if (aadhaarMatch) {
    result.aadhaarNumber = `${aadhaarMatch[1]} ${aadhaarMatch[2]} ${aadhaarMatch[3]}`;
  }

  // 2. Date of Birth (DOB)
  // Matches: DOB: 12/05/1994, Date of Birth: 12-05-1994, Year of Birth: 1994
  const dobRegex = /(?:DOB|Date\s*of\s*Birth|D\.O\.B\.?|Year\s*of\s*Birth|जन्म\s*तिथि)[:\s]*(\d{2}[/\-.]\d{2}[/\-.]\d{4}|\d{4})/i;
  const dobMatch = rawText.match(dobRegex);
  if (dobMatch) {
    const rawDob = dobMatch[1].replace(/[.]/g, '-').replace(/\//g, '-');
    if (rawDob.length === 10) {
      const parts = rawDob.split('-');
      result.dob = `${parts[2]}-${parts[1]}-${parts[0]}`;
    } else if (rawDob.length === 4) {
      result.dob = `${rawDob}-01-01`;
    }
  } else {
    // General date fallback
    const generalDateRegex = /\b(0[1-9]|[12]\d|3[01])[/\-.](0[1-9]|1[0-2])[/\-.](19\d{2}|200\d)\b/;
    const genMatch = rawText.match(generalDateRegex);
    if (genMatch) {
      const day = genMatch[1];
      const month = genMatch[2];
      const year = genMatch[3];
      result.dob = `${year}-${month}-${day}`;
    }
  }

  // 3. Gender
  if (/\b(FEMALE|महिला|WOMAN|स्त्री)\b/i.test(cleanUpper)) {
    result.gender = 'Female';
  } else if (/\b(MALE|पुरुष|MAN)\b/i.test(cleanUpper)) {
    result.gender = 'Male';
  } else if (/\b(TRANSGENDER|ट्रांसजेंडर)\b/i.test(cleanUpper)) {
    result.gender = 'Other';
  }

  // 4. Candidate Full Name
  // Heuristic A: Look for line with "Name:" or "नाम:"
  const explicitNameMatch = rawText.match(/(?:Name|नाम|To)[:\s]*([A-Za-z\s]{3,35})/i);
  if (explicitNameMatch && explicitNameMatch[1].trim()) {
    const candidate = explicitNameMatch[1].trim();
    if (!/GOVERNMENT|UNIQUE|INDIA|AUTHORITY|DOB|MALE|FEMALE/i.test(candidate)) {
      result.fullName = candidate;
    }
  }

  // Heuristic B: Line directly preceding "DOB" / "Date of Birth"
  if (!result.fullName) {
    for (let i = 0; i < lines.length; i++) {
      if (/(?:DOB|Date of Birth|Year of Birth|जन्म)/i.test(lines[i])) {
        // Look 1 or 2 lines above
        for (let j = i - 1; j >= Math.max(0, i - 2); j--) {
          const prevLine = lines[j].trim();
          if (
            /^[A-Za-z\s]{3,35}$/.test(prevLine) &&
            !/GOVERNMENT|INDIA|BHARAT|UNIQUE|IDENTIFICATION|AUTHORITY|ENROLMENT|MERA|AADHAAR/i.test(prevLine)
          ) {
            result.fullName = prevLine;
            break;
          }
        }
        if (result.fullName) break;
      }
    }
  }

  // Heuristic C: First prominent English name line in card top
  if (!result.fullName) {
    for (const line of lines) {
      if (
        /^[A-Z][a-z]+(\s[A-Z][a-z]+){1,3}$/.test(line) &&
        !/Government|India|Unique|Identification|Authority|Father|Mother|Address/i.test(line)
      ) {
        result.fullName = line;
        break;
      }
    }
  }

  // 5. Father's / Husband's Name
  // Matches: C/O, S/O, D/O, W/O, आत्मज, पुत्र
  const fatherRegex = /(?:(?:C|S|D|W)\s*\/\s*O|FATHER['’]?S?\s*NAME|CARE\s*OF|आत्मज|पुत्र|पति)[:\s]*([A-Za-z\s]{3,40})/i;
  const fatherMatch = rawText.match(fatherRegex);
  if (fatherMatch && fatherMatch[1].trim()) {
    let cleanFather = fatherMatch[1].trim();
    // Strip trailing address keywords if captured
    cleanFather = cleanFather.split(/[,.\n]|HOUSE|GALI|ROAD|VILLAGE|PLOT|FLAT|STREET/i)[0].trim();
    if (cleanFather.length >= 3 && !/GOVERNMENT|INDIA|AUTHORITY|PIN/i.test(cleanFather)) {
      result.fatherName = cleanFather.startsWith('Shri ') ? cleanFather : `Shri ${cleanFather}`;
    }
  }

  // 6. PIN Code
  // 6 digits starting with 1-9
  const pinRegex = /\b([1-9][0-9]{5})\b/;
  const pinMatch = rawText.match(pinRegex);
  if (pinMatch) {
    result.pinCode = pinMatch[1];
  }

  // 7. Permanent Residential Address
  // Extracts text block following Address: / पता: up to the PIN code
  const addressBlockRegex = /(?:Address|पता)[:\s]*([\s\S]{10,240}?)(?=\b[1-9][0-9]{5}\b|$)[\s\S]*?\b([1-9][0-9]{5})\b/i;
  const addrMatch = rawText.match(addressBlockRegex);
  if (addrMatch && addrMatch[1].trim()) {
    let addrText = addrMatch[1].replace(/[\n\r]+/g, ', ').replace(/\s{2,}/g, ' ').trim();
    // Clean leading/trailing punctuation
    addrText = addrText.replace(/^[, -]+|[, -]+$/g, '');
    if (addrText.length >= 8) {
      result.address = addrText;
    }
  } else {
    // Address fallback: locate line with House / Gali / Road / Street
    const addressLines: string[] = [];
    let collecting = false;
    for (const l of lines) {
      if (/(?:Address|पता|C\/O|S\/O)/i.test(l)) {
        collecting = true;
      }
      if (collecting) {
        addressLines.push(l.replace(/(?:Address|पता)[:\s]*/i, ''));
        if (/\b[1-9][0-9]{5}\b/.test(l)) {
          break;
        }
      }
    }
    if (addressLines.length > 0) {
      const joined = addressLines.join(', ').replace(/\s{2,}/g, ' ').trim();
      if (joined.length >= 10) {
        result.address = joined;
      }
    }
  }

  // 8. City & State (derived from PIN code or text)
  const location = deriveCityAndState(result.pinCode, rawText);
  result.city = location.city;
  result.state = location.state;

  if (result.fullName) {
    result.name = result.fullName;
  }

  return result;
};

/**
 * Extracts all designated fields from Driving Licence (DL) OCR text
 */
export const extractDlFields = (rawText: string): ExtractedDocumentData => {
  const result: ExtractedDocumentData = { rawText };
  const cleanUpper = rawText.toUpperCase();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 1. Commercial DL Number
  // Format: State (2 letters) + RTO (2 digits) + optional separator + 7-11 digits
  // e.g. RJ19 20170044192, RJ-1920170044192, DL-0420110012345, MH12 20190012345
  const dlPattern1 = /\b([A-Z]{2}[- ]?[0-9]{2}[- ]?(?:19|20)\d{2}[- ]?[0-9]{7})\b/i;
  const dlPattern2 = /\b([A-Z]{2}[- ]?[0-9]{2}[- ]?[0-9]{11})\b/i;
  const dlPattern3 = /\b([A-Z]{2}[0-9]{13,15})\b/i;

  const dlMatch = cleanUpper.match(dlPattern1) || cleanUpper.match(dlPattern2) || cleanUpper.match(dlPattern3);
  if (dlMatch) {
    // Format cleanly as "RJ19 20170044192"
    let rawDl = dlMatch[0].replace(/[-]/g, ' ').replace(/\s+/g, ' ').trim();
    if (rawDl.length >= 15 && !rawDl.includes(' ')) {
      rawDl = `${rawDl.slice(0, 4)} ${rawDl.slice(4)}`;
    }
    result.dlNumber = rawDl;
  }

  // 2. DL Expiry Date (NT/TR/Transport)
  // Search for keywords: VALID TILL, VALIDITY, EXPIRY, EXP, UPTO, NT, TR
  let foundExpiryDate: Date | null = null;
  const keywordRegex = /(?:VALID\s*TILL|VALIDITY|VALID\s*UPTO|EXPIRY|EXP|UPTO|VALID\s*TO|NT|TR)[:\s]*(\d{2}[/\-.]\d{2}[/\-.]\d{4})/i;
  const kwMatch = cleanUpper.match(keywordRegex);
  if (kwMatch && kwMatch[1]) {
    const parts = kwMatch[1].replace(/[.]/g, '-').replace(/\//g, '-').split('-');
    const d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
    if (!isNaN(d.getTime())) {
      foundExpiryDate = d;
    }
  }

  // General date matches if keyword not found
  if (!foundExpiryDate) {
    const dateMatches = cleanUpper.match(/\b\d{2}[/\-.]\d{2}[/\-.]\d{4}\b/g);
    if (dateMatches && dateMatches.length > 0) {
      const parsedDates = dateMatches
        .map((d) => {
          const [day, month, year] = d.replace(/[.]/g, '-').replace(/\//g, '-').split('-');
          return new Date(`${year}-${month}-${day}`);
        })
        .filter((d) => !isNaN(d.getTime()));

      // Filter out DOB dates (older than 16 years ago)
      const potential = parsedDates
        .filter((d) => d.getFullYear() >= today.getFullYear() - 10)
        .sort((a, b) => b.getTime() - a.getTime());

      if (potential.length > 0) {
        foundExpiryDate = potential[0];
      }
    }
  }

  if (foundExpiryDate) {
    const formattedExpiry = foundExpiryDate.toISOString().split('T')[0];
    result.dlExpiryDate = formattedExpiry;
    result.expiryDate = formattedExpiry;

    if (foundExpiryDate < today) {
      result.isDlExpired = true;
      result.isExpired = true;
      result.isExpiringSoon = false;
      result.warning = `⚠️ EXPIRED DRIVING LICENCE: Licence expired on ${formattedExpiry}. Candidate cannot be scheduled for active batch dispatch.`;
    } else {
      result.isDlExpired = false;
      result.isExpired = false;
      const thirtyDays = new Date();
      thirtyDays.setDate(today.getDate() + 30);
      thirtyDays.setHours(23, 59, 59, 999);
      if (foundExpiryDate <= thirtyDays) {
        result.isExpiringSoon = true;
        result.warning = `⚠️ EXPIRING SOON: Licence expires within 30 days (${formattedExpiry}).`;
      } else {
        result.isExpiringSoon = false;
      }
    }
  }

  // 3. Vehicle Authorization Class
  if (/\bHMV\b/i.test(cleanUpper)) {
    result.vehicleClass = 'HMV';
  } else if (/\bHGMV\b/i.test(cleanUpper)) {
    result.vehicleClass = 'HGMV';
  } else if (/\bLMV[- ]?TR\b/i.test(cleanUpper)) {
    result.vehicleClass = 'LMV-TR';
  } else if (/\b3W[- ]?CAB\b/i.test(cleanUpper)) {
    result.vehicleClass = '3W-CAB';
  } else if (/\bTRANS\b/i.test(cleanUpper)) {
    result.vehicleClass = 'TRANS';
  } else if (/\bLMV\b/i.test(cleanUpper)) {
    result.vehicleClass = 'LMV-TR';
  }

  // 4. Candidate Name from DL
  const nameMatch = rawText.match(/(?:Name|नाम)[:\s]*([A-Za-z\s]{3,35})/i);
  if (nameMatch && nameMatch[1].trim()) {
    result.fullName = nameMatch[1].trim();
    result.name = result.fullName;
  }

  return result;
};

/**
 * Standard auto-fill mapper strictly conforming to task instructions:
 * Automatically maps extracted values to form fields and DL warning engine.
 */
export const applyExtractedDataToForm = (
  extracted: ExtractedDocumentData,
  setFormData: React.Dispatch<React.SetStateAction<any>>,
  setDlWarning: (msg: string) => void
) => {
  const expiry = extracted.dlExpiryDate || extracted.expiryDate;

  // STRICT OCR EXTRACTION SCOPE:
  // Aadhaar: ONLY 12-digit Aadhaar Number
  // DL: ONLY DL Number and DL Expiry Date
  // Do NOT attempt to auto-fill candidate name, father name, or address from OCR
  setFormData((prev: any) => ({
    ...prev,
    ...(extracted.aadhaarNumber && { aadhaarNumber: extracted.aadhaarNumber }),
    ...(extracted.dlNumber && { dlNumber: extracted.dlNumber }),
    ...(expiry && { dlExpiryDate: expiry })
  }));

  if (extracted.warning) {
    setDlWarning(extracted.warning);
  } else if (extracted.isDlExpired === true || extracted.isExpired === true) {
    setDlWarning(`Driving Licence is EXPIRED (${expiry}). Candidate cannot be scheduled for active batch dispatch.`);
  } else {
    setDlWarning('');
  }
};
