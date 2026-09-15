import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { SignInPanel } from "@/components/auth/SignInPanel";

export const metadata: Metadata = {
  title: "Sign in — Malangeni Hub",
  description: "Sign in with Google to post, comment, join groups and list your services on Malangeni Hub.",
};

export default function LoginPage() {
  return (
    <Container as="main">
      <SignInPanel />
    </Container>
  );
}
