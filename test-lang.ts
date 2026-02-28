import { getCountryCodeForLocale } from "./src/utils/language";

const langs = ["en", "en-US", "sq", "am", "ar", "bn", "zh"];
for (const l of langs) {
  console.log(`${l} -> ${getCountryCodeForLocale(l)}`);
}
