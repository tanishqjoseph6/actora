type CrmPageHeaderProps = {
  badge: string;
  title: string;
  titleAccent: string;
  description: string;
};

export function CrmPageHeader({
  badge,
  title,
  titleAccent,
  description,
}: CrmPageHeaderProps) {
  return (
    <div className="mb-6 lg:mb-8">
      <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full border border-cyan-400/30 text-cyan-400 text-sm mb-4 bg-[#081226]/60 backdrop-blur-sm">
        {badge}
      </div>
      <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold">
        {title}{" "}
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#60A5FA] to-[#00CFFF]">
          {titleAccent}
        </span>
      </h1>
      <p className="text-gray-400 mt-2 lg:mt-3 text-base lg:text-lg max-w-2xl">
        {description}
      </p>
    </div>
  );
}
