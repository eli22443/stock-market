import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

export default function GeneralInfo() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>General Info</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">General information will be displayed here.</p>
      </CardContent>
    </Card>
  );
}
