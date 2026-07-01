/**
 * PiggyBank
 *
 * Shows the static piggy-bank.png image (served from /public) with a slow,
 * gentle idle bounce — purely decorative, not tied to pool size or month
 * progress. The real pool amount is the headline number below the image.
 */
const PiggyBank = ({ poolAmount = 0, caption = "" }) => {
	return (
		<div className="flex flex-col items-center">
			<img
				src="/piggy-bank.png"
				alt="Piggy bank"
				className="w-32 h-32 sm:w-40 sm:h-40 object-cover"
				style={{ animation: "piggyBankBounce 3.2s ease-in-out infinite" }}
			/>

			<div className="text-center">
				<div className="text-2xl sm:text-3xl font-extrabold text-primary tabular-nums">
					฿{Math.floor(poolAmount).toLocaleString()}
				</div>
				{caption && (
					<p className="text-xs text-base-content/60 mt-0.5 font-medium">
						{caption}
					</p>
				)}
			</div>

			<style>{`
				@keyframes piggyBankBounce {
					0%, 100% { transform: translateY(0px); }
					50% { transform: translateY(-6px); }
				}
			`}</style>
		</div>
	);
};

export default PiggyBank;