export const useEnvFeatureFlag = () => {
	const check = (flag: Uppercase<string>): boolean => {
		const key: `VUE_FEAT_${Uppercase<string>}` = `VUE_FEAT_${flag}`;
		const value = (import.meta.env as Record<Uppercase<string>, string | boolean | undefined>)[key];
		return value === 'false' ? false : !!value;
	};

	return {
		check,
	};
};
