"use client";

import { useEffect, useState } from "react";
import { X, Cake, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Birthday = {
  id: string;
  name: string;
  dateOfBirth: Date;
  type: "student" | "teacher";
  className: string | null;
  daysUntil: number;
};

interface BirthdayNotificationProps {
  birthdays: Birthday[];
}

export function BirthdayNotification({ birthdays }: BirthdayNotificationProps) {
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Load dismissed notifications from localStorage
    const stored = localStorage.getItem("dismissedBirthdays");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Only keep today's dismissals
        const today = new Date().toDateString();
        if (parsed.date === today) {
          setDismissed(parsed.ids || []);
        } else {
          // Clear old dismissals
          localStorage.removeItem("dismissedBirthdays");
        }
      } catch (e) {
        // Invalid data, clear it
        localStorage.removeItem("dismissedBirthdays");
      }
    }
  }, []);

  const handleDismiss = (id: string) => {
    const newDismissed = [...dismissed, id];
    setDismissed(newDismissed);

    // Save to localStorage
    localStorage.setItem(
      "dismissedBirthdays",
      JSON.stringify({
        date: new Date().toDateString(),
        ids: newDismissed,
      })
    );
  };

  // Don't render on server
  if (!mounted) return null;

  // Filter today's birthdays that haven't been dismissed
  const todayBirthdays = birthdays.filter(
    (b) => b.daysUntil === 0 && !dismissed.includes(`${b.type}-${b.id}`)
  );

  console.log(dismissed);
  console.log(todayBirthdays);

  if (todayBirthdays.length === 0) return null;

  return (
    <div className="space-y-3">
      {todayBirthdays.map((birthday) => (
        <Card
          key={`${birthday.type}-${birthday.id}`}
          className="border-pink-200 bg-linear-to-r from-pink-50 to-purple-50 shadow-md animate-in slide-in-from-top-5 duration-500"
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-pink-100 rounded-full">
                  <Cake className="h-5 w-5 text-pink-600" />
                </div>
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    Selamat Ulang Tahun! 🎉
                    <Sparkles className="h-4 w-4 text-yellow-500 animate-pulse" />
                  </CardTitle>
                  <CardDescription>Jangan lupa ucapkan selamat</CardDescription>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleDismiss(`${birthday.type}-${birthday.id}`)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-base">{birthday.name}</p>
                <p className="text-sm text-muted-foreground">
                  {birthday.type === "student"
                    ? `Siswa kelas ${birthday.className}`
                    : "Guru"}
                </p>
              </div>
              <div className="text-4xl">🎂</div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
