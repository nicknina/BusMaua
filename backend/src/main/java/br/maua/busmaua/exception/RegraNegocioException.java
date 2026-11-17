package br.maua.busmaua.exception;

/** Erro de validação de regra de negócio, com mensagem pronta para o usuário. */
public class RegraNegocioException extends RuntimeException {

    public RegraNegocioException(String mensagem) {
        super(mensagem);
    }
}
