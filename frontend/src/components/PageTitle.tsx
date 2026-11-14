type TitleProps = {
    label: string;
}

//Displays and formats the headers on various pages
export default function PageTitle({label}: TitleProps) {
   return (
    <div>
        <h1>{label}</h1>
    </div>
   );
   
}