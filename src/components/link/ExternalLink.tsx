type Props = {
  children: any;
  href: string;
};

export default function ExternalLink({ children, href }: Props): JSX.Element {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}
