const MUNICIPALITIES = [
  {
    prefectureId: "hyogo",
    prefectureName: "兵庫県",
    id: "amagasaki",
    name: "尼崎市"
  },
  {
    prefectureId: "osaka",
    prefectureName: "大阪府",
    id: "osaka-city",
    name: "大阪市"
  },
  {
    prefectureId: "aichi",
    prefectureName: "愛知県",
    id: "nagoya",
    name: "名古屋市"
  }
];

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const prefecture = searchParams.get("prefecture");

  const municipalities = prefecture
    ? MUNICIPALITIES.filter(
        (item) => item.prefectureId === prefecture
      )
    : MUNICIPALITIES;

  return Response.json({
    municipalities
  });
}
