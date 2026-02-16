export default function RiceTerraces({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1200 500"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Distant mountain silhouettes */}
      <path
        d="M0 220 Q60 140 140 170 Q200 190 260 150 Q340 100 420 130 Q480 150 540 110 Q620 60 720 100 Q780 125 840 85 Q920 40 1000 80 Q1060 105 1120 75 Q1170 55 1200 70 L1200 500 L0 500Z"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.15"
      />
      <path
        d="M0 250 Q80 190 160 210 Q240 230 320 185 Q400 145 500 175 Q580 200 660 165 Q740 130 840 160 Q920 185 1000 150 Q1080 120 1200 145"
        stroke="currentColor"
        strokeWidth="1.2"
        opacity="0.18"
      />

      {/* Mid-distance hills */}
      <path
        d="M0 280 Q100 240 200 255 Q300 270 380 235 Q460 200 560 225 Q640 245 740 215 Q820 190 920 210 Q1020 230 1100 205 Q1160 188 1200 195"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.22"
      />

      {/* === TERRACE 1 — highest === */}
      <path
        d="M0 305 Q60 275 140 282 Q240 294 340 268 Q440 242 540 260 Q640 278 740 255 Q840 232 940 250 Q1040 268 1140 248 Q1180 240 1200 244"
        stroke="currentColor"
        strokeWidth="1.8"
        opacity="0.3"
      />
      {/* Terrace lip / water edge */}
      <path
        d="M0 311 Q60 281 140 288 Q240 300 340 274 Q440 248 540 266 Q640 284 740 261 Q840 238 940 256 Q1040 274 1140 254 Q1180 246 1200 250"
        stroke="currentColor"
        strokeWidth="0.8"
        opacity="0.18"
      />
      {/* Water shimmer */}
      <line x1="180" y1="288" x2="280" y2="282" stroke="currentColor" strokeWidth="0.5" opacity="0.12" />
      <line x1="460" y1="256" x2="530" y2="262" stroke="currentColor" strokeWidth="0.5" opacity="0.12" />
      <line x1="760" y1="252" x2="830" y2="246" stroke="currentColor" strokeWidth="0.5" opacity="0.12" />
      <line x1="980" y1="258" x2="1040" y2="262" stroke="currentColor" strokeWidth="0.5" opacity="0.12" />
      {/* Seedlings */}
      <g opacity="0.28" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round">
        <line x1="180" y1="280" x2="180" y2="268" /><line x1="177" y1="272" x2="183" y2="266" /><line x1="183" y1="272" x2="177" y2="266" />
        <line x1="220" y1="284" x2="220" y2="272" /><line x1="217" y1="276" x2="223" y2="270" /><line x1="223" y1="276" x2="217" y2="270" />
        <line x1="480" y1="253" x2="480" y2="241" /><line x1="477" y1="245" x2="483" y2="239" /><line x1="483" y1="245" x2="477" y2="239" />
        <line x1="520" y1="258" x2="520" y2="246" /><line x1="517" y1="250" x2="523" y2="244" /><line x1="523" y1="250" x2="517" y2="244" />
        <line x1="780" y1="250" x2="780" y2="238" /><line x1="777" y1="242" x2="783" y2="236" /><line x1="783" y1="242" x2="777" y2="236" />
        <line x1="820" y1="244" x2="820" y2="232" /><line x1="817" y1="236" x2="823" y2="230" /><line x1="823" y1="236" x2="817" y2="230" />
        <line x1="1000" y1="256" x2="1000" y2="244" /><line x1="997" y1="248" x2="1003" y2="242" /><line x1="1003" y1="248" x2="997" y2="242" />
        <line x1="1060" y1="260" x2="1060" y2="248" /><line x1="1057" y1="252" x2="1063" y2="246" /><line x1="1063" y1="252" x2="1057" y2="246" />
      </g>

      {/* === TERRACE 2 === */}
      <path
        d="M0 335 Q80 308 180 316 Q300 330 400 304 Q500 280 620 298 Q720 312 820 290 Q920 268 1040 286 Q1120 298 1200 282"
        stroke="currentColor"
        strokeWidth="2"
        opacity="0.35"
      />
      <path
        d="M0 342 Q80 315 180 323 Q300 337 400 311 Q500 287 620 305 Q720 319 820 297 Q920 275 1040 293 Q1120 305 1200 289"
        stroke="currentColor"
        strokeWidth="0.8"
        opacity="0.2"
      />
      {/* Water shimmer */}
      <line x1="100" y1="320" x2="170" y2="322" stroke="currentColor" strokeWidth="0.6" opacity="0.14" />
      <line x1="320" y1="312" x2="390" y2="308" stroke="currentColor" strokeWidth="0.6" opacity="0.14" />
      <line x1="540" y1="292" x2="610" y2="298" stroke="currentColor" strokeWidth="0.6" opacity="0.14" />
      <line x1="740" y1="304" x2="810" y2="296" stroke="currentColor" strokeWidth="0.6" opacity="0.14" />
      <line x1="960" y1="278" x2="1030" y2="284" stroke="currentColor" strokeWidth="0.6" opacity="0.14" />
      {/* Seedlings */}
      <g opacity="0.32" stroke="currentColor" strokeWidth="1" strokeLinecap="round">
        <line x1="120" y1="315" x2="120" y2="301" /><line x1="117" y1="306" x2="123" y2="299" /><line x1="123" y1="306" x2="117" y2="299" />
        <line x1="155" y1="318" x2="155" y2="304" /><line x1="152" y1="309" x2="158" y2="302" /><line x1="158" y1="309" x2="152" y2="302" />
        <line x1="350" y1="308" x2="350" y2="294" /><line x1="347" y1="299" x2="353" y2="292" /><line x1="353" y1="299" x2="347" y2="292" />
        <line x1="385" y1="306" x2="385" y2="292" /><line x1="382" y1="297" x2="388" y2="290" /><line x1="388" y1="297" x2="382" y2="290" />
        <line x1="560" y1="290" x2="560" y2="276" /><line x1="557" y1="281" x2="563" y2="274" /><line x1="563" y1="281" x2="557" y2="274" />
        <line x1="600" y1="296" x2="600" y2="282" /><line x1="597" y1="287" x2="603" y2="280" /><line x1="603" y1="287" x2="597" y2="280" />
        <line x1="760" y1="300" x2="760" y2="286" /><line x1="757" y1="291" x2="763" y2="284" /><line x1="763" y1="291" x2="757" y2="284" />
        <line x1="980" y1="278" x2="980" y2="264" /><line x1="977" y1="269" x2="983" y2="262" /><line x1="983" y1="269" x2="977" y2="262" />
        <line x1="1060" y1="288" x2="1060" y2="274" /><line x1="1057" y1="279" x2="1063" y2="272" /><line x1="1063" y1="279" x2="1057" y2="272" />
      </g>

      {/* === TERRACE 3 === */}
      <path
        d="M0 368 Q100 342 200 350 Q320 362 420 338 Q520 316 640 332 Q740 345 860 325 Q960 306 1080 322 Q1150 332 1200 320"
        stroke="currentColor"
        strokeWidth="2.2"
        opacity="0.4"
      />
      <path
        d="M0 376 Q100 350 200 358 Q320 370 420 346 Q520 324 640 340 Q740 353 860 333 Q960 314 1080 330 Q1150 340 1200 328"
        stroke="currentColor"
        strokeWidth="0.9"
        opacity="0.22"
      />
      {/* Horizontal paddy dividers */}
      <line x1="50" y1="362" x2="190" y2="354" stroke="currentColor" strokeWidth="0.5" opacity="0.16" />
      <line x1="240" y1="358" x2="400" y2="344" stroke="currentColor" strokeWidth="0.5" opacity="0.16" />
      <line x1="450" y1="336" x2="620" y2="334" stroke="currentColor" strokeWidth="0.5" opacity="0.16" />
      <line x1="660" y1="340" x2="840" y2="330" stroke="currentColor" strokeWidth="0.5" opacity="0.16" />
      <line x1="880" y1="322" x2="1060" y2="324" stroke="currentColor" strokeWidth="0.5" opacity="0.16" />
      {/* Seedlings */}
      <g opacity="0.36" stroke="currentColor" strokeWidth="1" strokeLinecap="round">
        <line x1="80" y1="352" x2="80" y2="337" /><line x1="77" y1="342" x2="83" y2="335" /><line x1="83" y1="342" x2="77" y2="335" />
        <line x1="130" y1="349" x2="130" y2="334" /><line x1="127" y1="339" x2="133" y2="332" /><line x1="133" y1="339" x2="127" y2="332" />
        <line x1="270" y1="357" x2="270" y2="342" /><line x1="267" y1="347" x2="273" y2="340" /><line x1="273" y1="347" x2="267" y2="340" />
        <line x1="320" y1="354" x2="320" y2="339" /><line x1="317" y1="344" x2="323" y2="337" /><line x1="323" y1="344" x2="317" y2="337" />
        <line x1="370" y1="348" x2="370" y2="333" /><line x1="367" y1="338" x2="373" y2="331" /><line x1="373" y1="338" x2="367" y2="331" />
        <line x1="480" y1="332" x2="480" y2="317" /><line x1="477" y1="322" x2="483" y2="315" /><line x1="483" y1="322" x2="477" y2="315" />
        <line x1="560" y1="330" x2="560" y2="315" /><line x1="557" y1="320" x2="563" y2="313" /><line x1="563" y1="320" x2="557" y2="313" />
        <line x1="620" y1="334" x2="620" y2="319" /><line x1="617" y1="324" x2="623" y2="317" /><line x1="623" y1="324" x2="617" y2="317" />
        <line x1="770" y1="340" x2="770" y2="325" /><line x1="767" y1="330" x2="773" y2="323" /><line x1="773" y1="330" x2="767" y2="323" />
        <line x1="900" y1="320" x2="900" y2="305" /><line x1="897" y1="310" x2="903" y2="303" /><line x1="903" y1="310" x2="897" y2="303" />
        <line x1="1000" y1="324" x2="1000" y2="309" /><line x1="997" y1="314" x2="1003" y2="307" /><line x1="1003" y1="314" x2="997" y2="307" />
        <line x1="1100" y1="328" x2="1100" y2="313" /><line x1="1097" y1="318" x2="1103" y2="311" /><line x1="1103" y1="318" x2="1097" y2="311" />
      </g>

      {/* === TERRACE 4 — foreground, boldest === */}
      <path
        d="M0 400 Q120 375 240 384 Q360 394 460 372 Q560 352 680 368 Q780 380 900 362 Q1000 345 1100 358 Q1160 366 1200 356"
        stroke="currentColor"
        strokeWidth="2.5"
        opacity="0.45"
      />
      <path
        d="M0 409 Q120 384 240 393 Q360 403 460 381 Q560 361 680 377 Q780 389 900 371 Q1000 354 1100 367 Q1160 375 1200 365"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.25"
      />
      {/* Paddy dividers */}
      <line x1="60" y1="396" x2="220" y2="388" stroke="currentColor" strokeWidth="0.6" opacity="0.18" />
      <line x1="280" y1="392" x2="440" y2="378" stroke="currentColor" strokeWidth="0.6" opacity="0.18" />
      <line x1="490" y1="366" x2="660" y2="370" stroke="currentColor" strokeWidth="0.6" opacity="0.18" />
      <line x1="700" y1="374" x2="880" y2="366" stroke="currentColor" strokeWidth="0.6" opacity="0.18" />
      <line x1="920" y1="358" x2="1080" y2="360" stroke="currentColor" strokeWidth="0.6" opacity="0.18" />
      {/* Seedlings — larger and more visible in foreground */}
      <g opacity="0.42" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round">
        <line x1="80" y1="390" x2="80" y2="373" /><line x1="76" y1="379" x2="84" y2="371" /><line x1="84" y1="379" x2="76" y2="371" />
        <line x1="140" y1="386" x2="140" y2="369" /><line x1="136" y1="375" x2="144" y2="367" /><line x1="144" y1="375" x2="136" y2="367" />
        <line x1="200" y1="386" x2="200" y2="369" /><line x1="196" y1="375" x2="204" y2="367" /><line x1="204" y1="375" x2="196" y2="367" />
        <line x1="300" y1="390" x2="300" y2="373" /><line x1="296" y1="379" x2="304" y2="371" /><line x1="304" y1="379" x2="296" y2="371" />
        <line x1="380" y1="382" x2="380" y2="365" /><line x1="376" y1="371" x2="384" y2="363" /><line x1="384" y1="371" x2="376" y2="363" />
        <line x1="440" y1="376" x2="440" y2="359" /><line x1="436" y1="365" x2="444" y2="357" /><line x1="444" y1="365" x2="436" y2="357" />
        <line x1="520" y1="362" x2="520" y2="345" /><line x1="516" y1="351" x2="524" y2="343" /><line x1="524" y1="351" x2="516" y2="343" />
        <line x1="600" y1="366" x2="600" y2="349" /><line x1="596" y1="355" x2="604" y2="347" /><line x1="604" y1="355" x2="596" y2="347" />
        <line x1="660" y1="370" x2="660" y2="353" /><line x1="656" y1="359" x2="664" y2="351" /><line x1="664" y1="359" x2="656" y2="351" />
        <line x1="740" y1="376" x2="740" y2="359" /><line x1="736" y1="365" x2="744" y2="357" /><line x1="744" y1="365" x2="736" y2="357" />
        <line x1="830" y1="368" x2="830" y2="351" /><line x1="826" y1="357" x2="834" y2="349" /><line x1="834" y1="357" x2="826" y2="349" />
        <line x1="920" y1="360" x2="920" y2="343" /><line x1="916" y1="349" x2="924" y2="341" /><line x1="924" y1="349" x2="916" y2="341" />
        <line x1="1020" y1="358" x2="1020" y2="341" /><line x1="1016" y1="347" x2="1024" y2="339" /><line x1="1024" y1="347" x2="1016" y2="339" />
        <line x1="1120" y1="362" x2="1120" y2="345" /><line x1="1116" y1="351" x2="1124" y2="343" /><line x1="1124" y1="351" x2="1116" y2="343" />
      </g>

      {/* === TERRACE 5 — closest foreground === */}
      <path
        d="M0 435 Q100 412 220 420 Q340 430 440 410 Q540 392 660 406 Q760 416 880 400 Q980 385 1080 396 Q1150 404 1200 394"
        stroke="currentColor"
        strokeWidth="2.8"
        opacity="0.5"
      />
      <path
        d="M0 445 Q100 422 220 430 Q340 440 440 420 Q540 402 660 416 Q760 426 880 410 Q980 395 1080 406 Q1150 414 1200 404"
        stroke="currentColor"
        strokeWidth="1.2"
        opacity="0.28"
      />
      {/* Paddy dividers */}
      <line x1="40" y1="432" x2="200" y2="424" stroke="currentColor" strokeWidth="0.7" opacity="0.2" />
      <line x1="260" y1="428" x2="420" y2="414" stroke="currentColor" strokeWidth="0.7" opacity="0.2" />
      <line x1="470" y1="402" x2="640" y2="410" stroke="currentColor" strokeWidth="0.7" opacity="0.2" />
      <line x1="680" y1="412" x2="860" y2="404" stroke="currentColor" strokeWidth="0.7" opacity="0.2" />
      <line x1="900" y1="396" x2="1060" y2="398" stroke="currentColor" strokeWidth="0.7" opacity="0.2" />
      {/* Seedlings — largest */}
      <g opacity="0.48" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
        <line x1="60" y1="428" x2="60" y2="408" /><line x1="55" y1="416" x2="65" y2="406" /><line x1="65" y1="416" x2="55" y2="406" />
        <line x1="160" y1="422" x2="160" y2="402" /><line x1="155" y1="410" x2="165" y2="400" /><line x1="165" y1="410" x2="155" y2="400" />
        <line x1="280" y1="426" x2="280" y2="406" /><line x1="275" y1="414" x2="285" y2="404" /><line x1="285" y1="414" x2="275" y2="404" />
        <line x1="400" y1="414" x2="400" y2="394" /><line x1="395" y1="402" x2="405" y2="392" /><line x1="405" y1="402" x2="395" y2="392" />
        <line x1="500" y1="400" x2="500" y2="380" /><line x1="495" y1="388" x2="505" y2="378" /><line x1="505" y1="388" x2="495" y2="378" />
        <line x1="620" y1="408" x2="620" y2="388" /><line x1="615" y1="396" x2="625" y2="386" /><line x1="625" y1="396" x2="615" y2="386" />
        <line x1="720" y1="414" x2="720" y2="394" /><line x1="715" y1="402" x2="725" y2="392" /><line x1="725" y1="402" x2="715" y2="392" />
        <line x1="840" y1="404" x2="840" y2="384" /><line x1="835" y1="392" x2="845" y2="382" /><line x1="845" y1="392" x2="835" y2="382" />
        <line x1="960" y1="394" x2="960" y2="374" /><line x1="955" y1="382" x2="965" y2="372" /><line x1="965" y1="382" x2="955" y2="372" />
        <line x1="1100" y1="400" x2="1100" y2="380" /><line x1="1095" y1="388" x2="1105" y2="378" /><line x1="1105" y1="388" x2="1095" y2="378" />
      </g>

      {/* === TERRACE 6 — bottom edge === */}
      <path
        d="M0 468 Q120 448 240 455 Q360 464 460 446 Q560 430 680 442 Q780 452 900 438 Q1000 424 1100 434 Q1160 440 1200 432"
        stroke="currentColor"
        strokeWidth="3"
        opacity="0.55"
      />
      <path
        d="M0 478 Q120 458 240 465 Q360 474 460 456 Q560 440 680 452 Q780 462 900 448 Q1000 434 1100 444 Q1160 450 1200 442"
        stroke="currentColor"
        strokeWidth="1.2"
        opacity="0.3"
      />
      {/* Seedlings */}
      <g opacity="0.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
        <line x1="100" y1="455" x2="100" y2="434" /><line x1="95" y1="442" x2="105" y2="432" /><line x1="105" y1="442" x2="95" y2="432" />
        <line x1="320" y1="460" x2="320" y2="439" /><line x1="315" y1="447" x2="325" y2="437" /><line x1="325" y1="447" x2="315" y2="437" />
        <line x1="520" y1="440" x2="520" y2="419" /><line x1="515" y1="427" x2="525" y2="417" /><line x1="525" y1="427" x2="515" y2="417" />
        <line x1="700" y1="446" x2="700" y2="425" /><line x1="695" y1="433" x2="705" y2="423" /><line x1="705" y1="433" x2="695" y2="423" />
        <line x1="880" y1="440" x2="880" y2="419" /><line x1="875" y1="427" x2="885" y2="417" /><line x1="885" y1="427" x2="875" y2="417" />
        <line x1="1060" y1="436" x2="1060" y2="415" /><line x1="1055" y1="423" x2="1065" y2="413" /><line x1="1065" y1="423" x2="1055" y2="413" />
      </g>
    </svg>
  );
}
