import { notFound } from "next/navigation";

// Unknown paths inside a locale render the localised 404 page.
export default function CatchAll() {
  notFound();
}
