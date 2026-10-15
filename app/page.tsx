import { redirect } from "next/navigation";

// Keep the standalone website exactly as authored, including its script-free view.
export default function Home() {
  redirect("/product/index.html");
}
