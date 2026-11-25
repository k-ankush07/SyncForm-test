
import { useState, useEffect, useCallback } from "react";

export default function usePhoneField({
  savedValue,
  normalizedElement,
  type,
  value,
  setValue,
  reportChange,
  phoneCountryList,
}) {
  const configuredPhoneCountry =
    normalizedElement.defaultCountryCode &&
    normalizedElement.defaultCountryCode !== "auto"
      ? normalizedElement.defaultCountryCode.toLowerCase()
      : "in";

  const getSavedPhoneCountry = () => {
    if (
      savedValue &&
      typeof savedValue === "object" &&
      savedValue.country
    ) {
      return String(savedValue.country).toLowerCase();
    }

    return configuredPhoneCountry;
  };

  const [phoneCountry, setPhoneCountry] = useState(
    getSavedPhoneCountry
  );

  const [countryDropdownOpen, setCountryDropdownOpen] =
    useState(false);

  useEffect(() => {
    if (type !== "phone") return;

    const nextPhoneNumber =
      savedValue &&
      typeof savedValue === "object" &&
      !Array.isArray(savedValue)
        ? savedValue.number ?? ""
        : savedValue ?? normalizedElement.defaultValue ?? "";

    const nextCountry = getSavedPhoneCountry();

    setValue((previous) => {
      const next = String(nextPhoneNumber);
      return previous === next ? previous : next;
    });

    setPhoneCountry((previous) =>
      previous === nextCountry ? previous : nextCountry
    );

    setCountryDropdownOpen(false);
  }, [
    type,
    normalizedElement.id,
    normalizedElement.defaultCountryCode,
    normalizedElement.defaultValue,
    savedValue,
    setValue,
  ]);

  // Report phone number with country information.
  const reportPhoneValue = (
    nextNumber,
    countryCode = phoneCountry
  ) => {
    const selectedPhoneCountry = phoneCountryList.find(
      (country) =>
        country.value.toLowerCase() ===
        String(countryCode).toLowerCase()
    );

    reportChange({
      country:
        selectedPhoneCountry?.value?.toLowerCase() ||
        countryCode,
      dialCode: selectedPhoneCountry?.dialCode || "",
      number: nextNumber,
    });
  };

  // Change selected country.
  const handlePhoneCountryChange = (countryCode) => {
    const nextCountry = countryCode.toLowerCase();

    setPhoneCountry(nextCountry);
    reportPhoneValue(value, nextCountry);
  };

  // Handle phone input and international country detection.
  const handlePhoneChange = (newValue) => {
    const input = String(newValue ?? "");

    if (input.startsWith("+") || input.startsWith("00")) {
      const internationalInput = input.startsWith("00")
        ? `+${input.slice(2)}`
        : input;

      const digits = internationalInput
        .slice(1)
        .replace(/\D/g, "");

      const matches = phoneCountryList
        .filter((country) => {
          const dialCode = country.dialCode.replace(/\D/g, "");
          return digits.startsWith(dialCode);
        })
        .sort(
          (a, b) =>
            b.dialCode.replace(/\D/g, "").length -
            a.dialCode.replace(/\D/g, "").length
        );

      if (matches.length > 0) {
        const longestCode = matches[0].dialCode;

        const sameCodeMatches = matches.filter(
          (country) => country.dialCode === longestCode
        );

        const matchedCountry =
          sameCodeMatches.find(
            (country) =>
              country.value.toLowerCase() === phoneCountry
          ) || sameCodeMatches[0];

        const dialDigits = matchedCountry.dialCode.replace(
          /\D/g,
          ""
        );

        const phoneNumber = digits.slice(dialDigits.length);

        setPhoneCountry(matchedCountry.value.toLowerCase());
        setValue(phoneNumber);

        reportPhoneValue(phoneNumber, matchedCountry.value);
        return;
      }

      setValue(internationalInput);
      reportPhoneValue(internationalInput);
      return;
    }

    const phoneNumber = input.replace(/\D/g, "");

    setValue(phoneNumber);
    reportPhoneValue(phoneNumber);
  };

  const currentPhoneCountry =
  phoneCountryList.find(
    (country) =>
      country.value.toLowerCase() === phoneCountry
  ) ||
  phoneCountryList.find(
    (country) => country.value.toLowerCase() === "in"
  );

  const showPhoneCountry =
  normalizedElement.phoneValidation !== false ||
  normalizedElement.showCountryCode !== false;

 return {
  phoneCountry,
  setPhoneCountry,
  countryDropdownOpen,
  setCountryDropdownOpen,
  phoneCountryList,
  currentPhoneCountry,
  showPhoneCountry,
  reportPhoneValue,
  handlePhoneCountryChange,
  handlePhoneChange,
};
}
