/**
 * Server-only writing-style learning (uses googleapis).
 * Import only from Route Handlers / server utilities — never from Client Components.
 */
import "server-only";

export {
  fetchSentEmailSamples,
  learnWritingStyleFromSamples,
} from "./style-learn";
