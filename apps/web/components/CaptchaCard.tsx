import Link from "next/link";

interface CaptchaCardProps {
  title: React.ReactNode;
  description: React.ReactNode;
  link: string;
}

export const CaptchaCard = ({ title, description, link }: CaptchaCardProps) => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 flex flex-col items-center">
      <h2 className="text-lg font-bold text-gray-800 mb-4">{title}</h2>
      <p className="text-gray-600 text-center mb-6">{description}</p>
      <Link
        href={link}
        className="bg-green-500 text-white px-4 py-2 rounded-md font-semibold hover:bg-green-600 transition"
      >
        Access Captcha
      </Link>
    </div>
  );
};
