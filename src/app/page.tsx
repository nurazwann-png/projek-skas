import { redirect } from "next/navigation";

// Portal bermula di halaman log masuk (public/welcome.html); pengguna yang sudah log masuk dihantar ke papan pemuka dari situ.
export default function Laman() {
  redirect("/welcome.html");
}
