import { InviteAccept } from "../../../components/auth/InviteAccept";

export default function InvitePage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  return <InviteAccept searchParams={searchParams} />;
}
