import { AppContent } from "../../../App";
import { getLocalDateString } from "../../../utils/formatters";

export default function AgendaPage() {
  return <AppContent module="agenda" initialAgendaDate={getLocalDateString()} />;
}
