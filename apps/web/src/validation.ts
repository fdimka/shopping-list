// Hebrew letters plus optional niqqud. Numbers are valid only in the address.
const word =
  "[\\u05D0-\\u05EA][\\u05D0-\\u05EA\\u0591-\\u05C7'\u05F3\u05F4\"-]*";
const fullNamePattern = new RegExp(`^${word}(?: +${word})+$`, "u");
const addressPattern =
  /^[\u05D0-\u05EA\u0591-\u05C7\u05F3\u05F40-9 .,\/'"()\-]+$/u;
export function validateCustomer(
  fullName: string,
  address: string,
  email: string,
) {
  const errors: Record<string, string> = {};
  if (fullName.trim().length > 100 || !fullNamePattern.test(fullName.trim()))
    errors.fullName = "יש להזין שם פרטי ושם משפחה בעברית בלבד";
  if (
    address.trim().length < 5 ||
    address.trim().length > 300 ||
    !addressPattern.test(address.trim()) ||
    !/[\u05D0-\u05EA]/u.test(address)
  )
    errors.address =
      "יש להזין כתובת בעברית בלבד. ניתן לכלול מספרים וסימני פיסוק";
  if (
    email.trim().length > 254 ||
    !/^[A-Za-z0-9.!#$%&'*+\/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9.-]*[A-Za-z0-9])?\.[A-Za-z]{2,}$/.test(
      email.trim(),
    )
  )
    errors.email = "יש להזין כתובת מייל תקינה";
  return errors;
}
export function hebrewInput(value: string, address = false) {
  return value.replace(
    address
      ? /[^\u05D0-\u05EA\u0591-\u05C7\u05F3\u05F40-9 .,\/'"()\-]/gu
      : /[^\u05D0-\u05EA\u0591-\u05C7\u05F3\u05F4 '"\-]/gu,
    "",
  );
}
