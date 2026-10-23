// Creates (or resets) a staff account from the command line.
// Usage: pnpm admin:create you@example.com "Your Name" admin|staff
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { scriptDb } from "../db/script-client";
import { users } from "../db/schema";

async function main() {
  const [email, name = "Admin", role = "admin"] = process.argv.slice(2);
  if (!email || !/^[^@\s]+@[^@\s]+$/.test(email)) {
    console.error('Usage: pnpm admin:create you@example.com "Your Name" admin|staff');
    process.exit(1);
  }
  const { db, sql } = scriptDb();
  const password = randomBytes(12).toString("base64url");
  const passwordHash = await bcrypt.hash(password, 12);
  await db
    .insert(users)
    .values({
      email: email.toLowerCase(),
      name,
      role: role === "staff" ? "staff" : "admin",
      passwordHash,
      mustChangePassword: true,
    })
    .onConflictDoUpdate({
      target: users.email,
      set: {
        passwordHash,
        mustChangePassword: true,
        failedLogins: 0,
        lockedUntil: null,
        isActive: true,
      },
    });
  console.log(`\n${email} can now sign in at /admin/login`);
  console.log(`Temporary password (change it after signing in): ${password}\n`);
  await sql.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
