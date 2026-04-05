import { BadGatewayException, NotFoundException } from '@nestjs/common';

type ViaCepResponse = {
  cep?: string;
  logradouro?: string;
  complemento?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  erro?: boolean;
};

export type ZipCodeLookupResult = {
  zipCode: string;
  street: string;
  complement: string | null;
  neighborhood: string;
  city: string;
  state: string;
};

export async function lookupViaCep(
  zipCode: string,
): Promise<ZipCodeLookupResult> {
  const response = await fetch(`https://viacep.com.br/ws/${zipCode}/json/`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(5_000),
  });

  if (!response.ok) {
    throw new BadGatewayException(
      'Nao foi possivel consultar o CEP no ViaCEP.',
    );
  }

  const data = (await response.json()) as ViaCepResponse;

  if (data.erro) {
    throw new NotFoundException('CEP nao encontrado no ViaCEP.');
  }

  return {
    zipCode: data.cep?.trim() || zipCode,
    street: data.logradouro?.trim() || '',
    complement: data.complemento?.trim() || null,
    neighborhood: data.bairro?.trim() || '',
    city: data.localidade?.trim() || '',
    state: data.uf?.trim() || '',
  };
}
