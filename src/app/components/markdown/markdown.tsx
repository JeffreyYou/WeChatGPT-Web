import ReactMarkdown from "react-markdown";
import "katex/dist/katex.min.css";
import RemarkMath from "remark-math";
import RemarkBreaks from "remark-breaks";
import RehypeKatex from "rehype-katex";
import RemarkGfm from "remark-gfm";
import RehypeHighlight from "rehype-highlight";
import { useRef, useState, RefObject, useEffect } from "react";
import mermaid from "mermaid";
import React from "react";
import { useDebouncedCallback, useThrottledCallback } from "use-debounce";
import LoadingIcon from "../../icons/three_dot.svg";
import {copyToClipboard} from '@/utils'

function extractCodeBlocks(text: string) {
    // This regular expression matches all code blocks that are wrapped in triple backticks
    const codeBlockRegex = /```([\s\S]*?)```/g;
    const codeBlocks = [];
    let match;
  
    // Use a while loop to find all matches in the text
    while ((match = codeBlockRegex.exec(text)) !== null) {
      // The first capture group in the regex represents the content of the code block
      codeBlocks.push(match[1]);
    }
  
    return codeBlocks;
}

export function Mermaid(props: { code: string }) {
    const ref = useRef<HTMLDivElement>(null);
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        if (props.code && ref.current) {
            mermaid
                .run({
                    nodes: [ref.current],
                    suppressErrors: true,
                })
                .catch((e) => {
                    setHasError(true);
                    console.error("[Mermaid] ", e.message);
                });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.code]);

    function viewSvgInNewWindow() {
        const svg = ref.current?.querySelector("svg");
        if (!svg) return;
        const text = new XMLSerializer().serializeToString(svg);
        const blob = new Blob([text], { type: "image/svg+xml" });
        const url = URL.createObjectURL(blob);
        const win = window.open(url);
        if (win) {
            win.onload = () => URL.revokeObjectURL(url);
        }
    }

    if (hasError) {
        return null;
    }

    return (
        <div
            className="no-dark mermaid"
            style={{
                cursor: "pointer",
                overflow: "auto",
            }}
            ref={ref}
            onClick={() => viewSvgInNewWindow()}
        >
            {props.code}
        </div>
    );
}

export function PreCode(props: { children: any }) {
// export function PreCode(props: { content: string }) {
    const ref = useRef<HTMLPreElement>(null);
    const refText = ref.current?.innerText;
    const [mermaidCode, setMermaidCode] = useState("");

    const renderMermaid = useDebouncedCallback(() => {
        if (!ref.current) return;
        const mermaidDom = ref.current.querySelector("code.language-mermaid");
        if (mermaidDom) {
            setMermaidCode((mermaidDom as HTMLElement).innerText);
        }
    }, 600);

    useEffect(() => {
        setTimeout(renderMermaid, 1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [refText]);

    return (
        <>
            {mermaidCode.length > 0 && (
                <Mermaid code={mermaidCode} key={mermaidCode} />
            )}
            <pre ref={ref}>
                {/* <span
                    className="copy-code-button"
                    onClick={copyToClipboard(props.content)}
                ></span> */}
                {props.children}
            </pre>
        </>
    );
}

function _MarkDownContent(props: { content: string }) {
    return (
        <ReactMarkdown
            remarkPlugins={[RemarkMath, RemarkGfm, RemarkBreaks]}
            rehypePlugins={[
                RehypeKatex,
                [
                    RehypeHighlight,
                    {
                        detect: false,
                        ignoreMissing: true,
                    },
                ],
            ]}
            components={{
                pre: PreCode,
                a: (aProps) => {
                    const href = aProps.href || "";
                    const isInternal = /^\/#/i.test(href);
                    const target = isInternal ? "_self" : aProps.target ?? "_blank";
                    return <a {...aProps} target={target} />;
                },
            }}
        >
            {props.content}
        </ReactMarkdown>
    );
}

export const MarkdownContent = React.memo(_MarkDownContent);

export function Markdown(
    props: {
        content: string;
        loading?: boolean;
        fontSize?: number;
        parentRef?: RefObject<HTMLDivElement>;
        defaultShow?: boolean;
    } & React.DOMAttributes<HTMLDivElement>,
) {

    return (
        <div
            className="markdown-body"
            style={{
                fontSize: `${props.fontSize ?? 14}px`,
                direction: /[\u0600-\u06FF]/.test(props.content) ? "rtl" : "ltr",
            }}
        >
            {
                props.loading ?
                    <LoadingIcon />
                    :
                    <MarkdownContent content={props.content} />
            }
        </div>
    );
}