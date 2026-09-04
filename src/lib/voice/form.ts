export async function twilioFields(request: Request) {
  const form = await request.formData();
  const get = (k: string) => String(form.get(k) ?? "");
  return {
    callSid: get("CallSid"),
    from: get("From"),
    to: get("To"),
    speech: get("SpeechResult"),
    digits: get("Digits"),
    status: get("CallStatus"),
    duration: get("CallDuration"),
    body: get("Body"),
  };
}
