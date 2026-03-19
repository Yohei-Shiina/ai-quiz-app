import { signIn } from "@/auth";

export default function LoginPage() {
  return (
    <main>
      <form
        action={async () => {
          "use server";
          await signIn("google", { redirectTo: "/home" });
        }}
      >
        <button type="submit">Sign in with Google</button>
      </form>
    </main>
  );
}
