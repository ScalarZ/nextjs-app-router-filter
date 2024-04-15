import { headers } from "next/headers";
import { db } from "@/drizzle/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, users } from "@/drizzle/schema";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Trash2 } from "lucide-react";
import { and, eq, like } from "drizzle-orm";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const countries = ["Algeria", "Canada"];

export default async function Home({
  searchParams,
}: {
  searchParams: { [key in string]: string | string[] | undefined };
}) {
  let usersList: Users[] | null = null;
  const tabDefaultValue = searchParams.tab as "users" | "add_user";
  const country = searchParams.country as string | undefined;
  const name = searchParams.name as string | undefined;
  const dialog = searchParams.dialog as string | undefined;

  try {
    const dbQuery = db.select().from(users);
    const queryList = [];
    if (country) queryList.push(eq(users.country, country.toLocaleLowerCase()));
    if (name) queryList.push(like(users.name, `%${name}%`));
    usersList = await dbQuery.where(and(...queryList));
  } catch (error) {
    console.error(error);
  }

  if (!usersList) return <p>Error fetching users</p>;

  console.log({ tabDefaultValue });
  return (
    <main className="flex min-h-screen flex-col items-center gap-8 p-24">
      <h1 className="text-6xl font-black">Next.js App Router Filter</h1>
      <p className="text-xl font-medium text-stone-400">
        No &quot;use client&quot;
      </p>
      <Tabs
        defaultValue={tabDefaultValue === "add_user" ? "add-user" : "users"}
        className="w-[400px]"
      >
        <TabsList className="grid w-full grid-cols-2">
          <Link href="?tab=users">
            <TabsTrigger value="users">Users</TabsTrigger>
          </Link>
          <Link href="?tab=add_user">
            <TabsTrigger value="add-user">Add user</TabsTrigger>
          </Link>
        </TabsList>
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Users List</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <form
                action={async (formData: FormData) => {
                  "use server";
                  const referer = headers().get("referer");
                  if (!referer) return;
                  const url = new URL(referer);
                  let query = "?";
                  for (const pair of formData.entries() as unknown as []) {
                    if (pair[1]) url.searchParams.set(pair[0], pair[1]);
                    else url.searchParams.delete(pair[0]);
                  }
                  for (const pair of url.searchParams.entries() as unknown as []) {
                    query += `${pair[0]}=${pair[1]}&`;
                  }
                  redirect(url.origin + query);
                }}
                className="flex flex-col gap-y-2"
              >
                <h2 className="text-lg font-medium">Filters</h2>
                <Input
                  defaultValue={name}
                  name="name"
                  placeholder="Search for name"
                />
                <div>
                  <Select name="country" defaultValue={""}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country, i) => (
                        <SelectItem key={i} value={country}>
                          {country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-x-2">
                  <Link href="?tab=users" className="w-full">
                    <Button
                      type="button"
                      variant={"outline"}
                      className="w-full"
                    >
                      Clear
                    </Button>
                  </Link>
                  <Button type="submit" className="w-full">
                    Filter
                  </Button>
                </div>
              </form>
              <Table>
                <TableHeader>
                  <TableRow className="border-stone-800">
                    <TableHead>Id</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersList.map((user) => (
                    <TableRow key={user.id} className="border-stone-800">
                      <TableCell className="font-medium">{user.id}</TableCell>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>{user.country}</TableCell>
                      <TableCell className="text-right">
                        <form
                          action={async () => {
                            "use server";
                            try {
                              await db
                                .delete(users)
                                .where(eq(users.id, user.id));
                            } catch (error) {
                              console.error(error);
                            }
                            revalidatePath("/");
                          }}
                        >
                          <button type="submit">
                            <Trash2
                              size={20}
                              className="cursor-pointer text-red-500"
                            />
                          </button>
                        </form>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="add-user">
          <Card>
            <CardHeader>
              <CardTitle>Add User</CardTitle>
            </CardHeader>
            <form
              action={async (formData: FormData) => {
                "use server";
                const name = formData.get("name") as string;
                const country = formData.get("country") as string;
                try {
                  await db.insert(users).values({ name, country });
                } catch (error) {
                  console.error(error);
                }
                redirect("?tab=users");
              }}
            >
              <CardContent className="space-y-8">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Enter a name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="name">Country</Label>
                  <Select name="country" required>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country, i) => (
                        <SelectItem key={i} value={country.toLocaleLowerCase()}>
                          {country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full">
                  Add
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
}
