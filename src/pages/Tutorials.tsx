import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, CheckCircle2, Clock, Lightbulb, Tag } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  fetchTutorialLessons,
  getTutorialCategories,
  type TutorialDifficulty,
  type TutorialLesson,
} from "@/lib/tutorialsData";

const completedKey = "querycraft_tutorials_completed_v1";
const bookmarksKey = "querycraft_tutorials_bookmarked_v1";

const difficultyLevels: Array<"All" | TutorialDifficulty> = ["All", "Beginner", "Intermediate", "Advanced"];

function safeReadStringArray(key: string): string[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.map((item) => String(item)) : [];
  } catch {
    return [];
  }
}

function safeWriteStringArray(key: string, value: string[]) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore write failures (private mode / quota)
  }
}

const Tutorials = () => {
  const [lessons, setLessons] = useState<TutorialLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeDifficulty, setActiveDifficulty] = useState<"All" | TutorialDifficulty>("All");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [completedIds, setCompletedIds] = useState<string[]>(() => safeReadStringArray(completedKey));
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(() => safeReadStringArray(bookmarksKey));

  useEffect(() => {
    let active = true;

    const loadLessons = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await fetchTutorialLessons();
        if (!active) return;
        setLessons(data);
        setSelectedId(data[0]?.id || null);
      } catch (e) {
        if (!active) return;
        console.error("Failed to load tutorials", e);
        setError("Unable to load tutorials right now.");
      } finally {
        if (active) setLoading(false);
      }
    };

    loadLessons();

    return () => {
      active = false;
    };
  }, []);

  const categories = useMemo(() => getTutorialCategories(lessons), [lessons]);

  const filteredLessons = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return lessons.filter((lesson) => {
      const categoryMatch = activeCategory === "All" || lesson.category === activeCategory;
      const difficultyMatch = activeDifficulty === "All" || lesson.difficulty === activeDifficulty;
      const searchMatch =
        !term ||
        lesson.title.toLowerCase().includes(term) ||
        lesson.summary.toLowerCase().includes(term) ||
        lesson.category.toLowerCase().includes(term);

      return categoryMatch && difficultyMatch && searchMatch;
    });
  }, [lessons, activeCategory, activeDifficulty, searchTerm]);

  const selectedLesson = useMemo(
    () => filteredLessons.find((item) => item.id === selectedId) || filteredLessons[0] || null,
    [filteredLessons, selectedId],
  );

  const completionPercent = useMemo(() => {
    if (!lessons.length) return 0;
    return Math.round((completedIds.length / lessons.length) * 100);
  }, [completedIds, lessons]);

  useEffect(() => {
    if (!selectedLesson && filteredLessons.length) {
      setSelectedId(filteredLessons[0].id);
    }
  }, [filteredLessons, selectedLesson]);

  const toggleCompleted = (id: string) => {
    const next = completedIds.includes(id) ? completedIds.filter((x) => x !== id) : [...completedIds, id];
    setCompletedIds(next);
    safeWriteStringArray(completedKey, next);
  };

  const toggleBookmark = (id: string) => {
    const next = bookmarkedIds.includes(id) ? bookmarkedIds.filter((x) => x !== id) : [...bookmarkedIds, id];
    setBookmarkedIds(next);
    safeWriteStringArray(bookmarksKey, next);
  };

  const nextLesson = useMemo(() => {
    if (!selectedLesson) return null;
    const index = filteredLessons.findIndex((item) => item.id === selectedLesson.id);
    if (index < 0 || index >= filteredLessons.length - 1) return null;
    return filteredLessons[index + 1];
  }, [selectedLesson, filteredLessons]);

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl">
      <div className="rounded-2xl border border-border/70 bg-gradient-to-r from-primary/10 via-background to-secondary/10 dark:from-primary/15 dark:to-secondary/15 p-5 md:p-6 shadow-soft">
        <h1 className="text-2xl font-heading font-bold text-foreground">SQL Tutorials</h1>
        <p className="text-muted-foreground mt-1">Interactive, structured lessons to help students learn SQL smoothly.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="border-border shadow-card">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Lessons</p>
            <p className="text-2xl font-heading font-bold text-foreground">{lessons.length}</p>
          </CardContent>
        </Card>
        <Card className="border-border shadow-card">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Completed</p>
            <p className="text-2xl font-heading font-bold text-secondary">{completedIds.length}</p>
          </CardContent>
        </Card>
        <Card className="border-border shadow-card">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Progress</p>
            <p className="text-2xl font-heading font-bold text-primary">{completionPercent}%</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border shadow-card">
        <CardContent className="p-4 space-y-3">
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by title, topic, or category..."
          />

          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => {
                  setActiveCategory(category);
                  setSelectedId(null);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  activeCategory === category
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/70"
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {difficultyLevels.map((difficulty) => (
              <button
                key={difficulty}
                onClick={() => {
                  setActiveDifficulty(difficulty);
                  setSelectedId(null);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  activeDifficulty === difficulty
                    ? "bg-secondary text-secondary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/70"
                }`}
              >
                {difficulty}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-destructive/30 bg-destructive/10">
          <CardContent className="p-4 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-[330px_1fr] gap-6">
        <div className="space-y-2 max-h-[calc(100vh-260px)] overflow-auto pr-1 rounded-xl">
          {loading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-20 rounded-xl border border-border bg-card animate-pulse" />
            ))
          ) : filteredLessons.length ? (
            filteredLessons.map((lesson) => {
              const isSelected = selectedLesson?.id === lesson.id;
              const isCompleted = completedIds.includes(lesson.id);
              const isBookmarked = bookmarkedIds.includes(lesson.id);

              return (
                <button
                  key={lesson.id}
                  onClick={() => setSelectedId(lesson.id)}
                  className={`w-full text-left rounded-xl border p-4 transition-all duration-200 ${
                    isSelected ? "border-primary bg-primary/10 shadow-soft" : "border-border bg-card hover:shadow-card hover:-translate-y-0.5"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-heading font-semibold text-sm text-foreground truncate">{lesson.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{lesson.summary}</p>
                      <div className="flex items-center gap-2 mt-2 text-[11px] text-muted-foreground">
                        <span className="inline-flex items-center gap-1"><Tag className="w-3 h-3" />{lesson.category}</span>
                        <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" />{lesson.readTimeMin} min</span>
                        <Badge variant="outline" className="text-[10px]">{lesson.difficulty}</Badge>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {isCompleted && <CheckCircle2 className="w-4 h-4 text-secondary" />}
                      {isBookmarked && <BookOpen className="w-4 h-4 text-primary" />}
                    </div>
                  </div>
                </button>
              );
            })
          ) : (
            <Card className="border-border shadow-card">
              <CardContent className="p-4 text-sm text-muted-foreground">No tutorials found for this filter.</CardContent>
            </Card>
          )}
        </div>

        <Card className="border-border shadow-card min-h-[460px]">
          {selectedLesson ? (
            <>
              <CardHeader className="pb-2 border-b border-border/70 bg-muted/20 rounded-t-xl">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <Badge variant="secondary">{selectedLesson.category}</Badge>
                  <Badge variant="outline">{selectedLesson.difficulty}</Badge>
                  <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {selectedLesson.readTimeMin} min
                  </span>
                </div>
                <CardTitle className="text-xl font-heading">{selectedLesson.title}</CardTitle>
                <CardDescription>{selectedLesson.summary}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant={completedIds.includes(selectedLesson.id) ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => toggleCompleted(selectedLesson.id)}
                  >
                    {completedIds.includes(selectedLesson.id) ? "Completed" : "Mark as Complete"}
                  </Button>
                  <Button
                    variant={bookmarkedIds.includes(selectedLesson.id) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleBookmark(selectedLesson.id)}
                  >
                    {bookmarkedIds.includes(selectedLesson.id) ? "Bookmarked" : "Bookmark"}
                  </Button>
                </div>

                <Tabs defaultValue="lesson" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="lesson">Lesson</TabsTrigger>
                    <TabsTrigger value="examples">SQL Examples</TabsTrigger>
                    <TabsTrigger value="checklist">Checklist</TabsTrigger>
                  </TabsList>

                  <TabsContent value="lesson" className="space-y-2">
                    {selectedLesson.content.map((line, index) => (
                      <p key={`${selectedLesson.id}-line-${index}`} className="text-sm text-muted-foreground leading-relaxed">
                        {line}
                      </p>
                    ))}
                  </TabsContent>

                  <TabsContent value="examples" className="space-y-2">
                    {selectedLesson.sqlExamples.map((sql, index) => (
                      <pre
                        key={`${selectedLesson.id}-sql-${index}`}
                        className="text-xs font-mono bg-muted/60 rounded-lg border border-border p-3 overflow-auto text-foreground"
                      >
                        {sql}
                      </pre>
                    ))}
                  </TabsContent>

                  <TabsContent value="checklist" className="space-y-2">
                    {selectedLesson.checklist.map((item, index) => (
                      <div key={`${selectedLesson.id}-todo-${index}`} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Lightbulb className="w-4 h-4 text-primary mt-0.5" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </TabsContent>
                </Tabs>

                <div className="flex flex-wrap items-center justify-between pt-2 border-t border-border">
                  <Link to="/learn" className="text-sm text-primary hover:underline">Try in Learn Mode</Link>
                  {nextLesson && (
                    <Button variant="accent" size="sm" onClick={() => setSelectedId(nextLesson.id)}>
                      Next Lesson <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </>
          ) : (
            <CardContent className="p-8 h-full flex items-center justify-center text-center">
              <div>
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <BookOpen className="w-7 h-7 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">Select a tutorial to start learning.</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Tutorials;

// File use case:
// This page provides a dynamic SQL learning experience with search, filter, progress, bookmarks, and lesson details.
// It consumes tutorial data via a backend-ready loader (with local fallback) so students can learn smoothly even offline.
// It is designed for gradual API integration while keeping rich UI and functional learning flow in production today.
