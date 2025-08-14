import { ImageResponse } from "@vercel/og";

export const runtime = "edge";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const text = searchParams.get("text");

  const fontData = await fetch(
    new URL("../../../../public/fonts/inter-bold.otf", import.meta.url),
  ).then((res) => res.arrayBuffer());

  if (!text) {
    return new Response("Missing text", { status: 400 });
  }

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "white",
          backgroundImage:
            "linear-gradient(to bottom right, #E0E7FF 25%, #FFFFFF 50%, #E0E7FF 75%)",
        }}
      >
        <div
          style={{
            position: "absolute",
            bottom: 20,
            left: 0,
            right: 0,
            display: "flex",
            alignItems: "center",
          }}
        >
          <div
            style={{
              fontSize: 19,
              marginRight: 10,
              fontFamily: fontData ? "Inter" : "sans-serif",
            }}
          >
            {/* Source: */}
          </div>
          <div
            style={{
              marginLeft: 10,
              marginRight: 10,
              fontSize: 18,
              opacity: 0.7,
              fontWeight: 400,
              fontFamily: "sans-serif",
            }}
          >
            Source:
          </div>
          <svg
            width="36"
            height="36"
            opacity={0.7}
            viewBox="0 0 242 241"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M181.953 103.51L188.778 84.3411L170.276 91.4126L162.988 78.4228L142.911 103.336L147.09 62.4521L130.604 66.3033L120.901 47.7651L111.219 66.3033L94.7332 62.4521L98.9125 103.336L78.814 78.4228L71.5264 91.4126L53.045 84.3411L59.8705 103.51L47.3115 111.06L97.7154 154.664H144.087L194.512 111.06L181.953 103.51Z"
              fill="black"
            ></path>
            <path
              d="M112.877 167.198H128.922C129.216 167.198 129.468 167.437 129.489 167.742L131.737 192.96C131.758 193.308 131.506 193.612 131.17 193.612H110.609C110.273 193.612 110 193.308 110.042 192.96L112.289 167.742C112.31 167.437 112.562 167.198 112.856 167.198H112.877Z"
              fill="black"
            ></path>
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M94.9466 0H146.368V0.0247002C154.242 0.0247002 161.925 2.59352 168.296 7.38536L209.887 38.6805C216.258 43.4724 221.006 50.2155 223.44 57.9714L239.332 108.582C241.766 116.338 241.766 124.687 239.332 132.443L223.44 183.053C221.006 190.784 216.258 197.552 209.887 202.344L168.296 233.639C161.925 238.431 154.242 241 146.368 241H94.9466C87.0723 241 79.389 238.431 73.018 233.639L31.4276 202.344C25.0566 197.552 20.3082 190.809 17.8743 183.053L1.98262 132.443C-0.451239 124.687 -0.451239 116.338 1.98262 108.582L17.8743 57.9467C20.3082 50.2155 25.0566 43.4477 31.4276 38.6558L73.018 7.36066C79.389 2.56882 87.0723 0 94.9466 0ZM98.029 14.3517H143.288V14.3734C150.218 14.3734 156.981 16.6363 162.588 20.8575L199.194 48.4254C204.801 52.6465 208.981 58.5866 211.123 65.4187L225.11 110.002C227.252 116.834 227.252 124.188 225.11 131.02L211.123 175.603C208.981 182.414 204.801 188.376 199.194 192.597L162.588 220.165C156.981 224.386 150.218 226.649 143.288 226.649H98.029C91.0985 226.649 84.336 224.386 78.7285 220.165L42.1227 192.597C36.5153 188.376 32.336 182.436 30.1938 175.603L16.2067 131.02C14.0646 124.188 14.0646 116.834 16.2067 110.002L30.1938 65.397C32.336 58.5866 36.5153 52.6248 42.1227 48.4036L78.7285 20.8357C84.336 16.6146 91.0985 14.3517 98.029 14.3517Z"
              fill="black"
            ></path>
          </svg>
          <div
            style={{
              marginLeft: 10,
              fontSize: 36,
              opacity: 0.7,
              fontWeight: 400,
              fontFamily: "sans-serif",
            }}
          >
            canadaspends.com
          </div>
        </div>
        <div
          style={{
            fontSize: 60,
            fontWeight: 700,
            fontFamily: fontData ? "Inter" : "sans-serif",
            textAlign: "center",
            padding: "0 50px",
            color: "#1F2937",
            lineHeight: 1.2,
          }}
        >
          {text}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: fontData
        ? [
            {
              name: "Inter",
              data: fontData,
              style: "normal",
              weight: 700,
            },
          ]
        : [],
    },
  );
}
