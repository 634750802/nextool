export default async function Page () {
  await new Promise(resolve => setTimeout(resolve, 100));

  return <div>done</div>
}