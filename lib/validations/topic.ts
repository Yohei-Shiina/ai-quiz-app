export function validateTopicTitle(title: FormDataEntryValue | null) {
  if (!title || typeof title !== "string" || !title.trim()) {
    return "Title is required";
  }
  return null;
}
